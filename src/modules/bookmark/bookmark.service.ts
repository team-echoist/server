import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BookmarkRepository } from './bookmark.repository';
import { User } from '../../entities/user.entity';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Bookmark } from '../../entities/bookmark.entity';
import { UserService } from '../user/user.service';
import { EssaysResDto } from '../essay/dto/response/essaysRes.dto';
import { UtilsService } from '../utils/utils.service';
import { Transactional } from 'typeorm-transactional';
import { EssayService } from '../essay/essay.service';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectQueue('bookmark') private readonly bookmarkQueue: Queue,
  ) {}

  @Transactional()
  async getUserBookmarks(userId: number, page: number, limit: number) {
    const { bookmarks, total } = await this.bookmarkRepository.findUserBookmarks(
      userId,
      page,
      limit,
    );

    const essays = bookmarks.map((bookmark) => bookmark.essay);
    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });

    const essaysDto = this.utilsService.transformToDto(EssaysResDto, essays);

    return { essays: essaysDto, totalPage, page, total };
  }

  @Transactional()
  async addBookmark(userId: number, essayId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const essay = await this.essayService.getEssayById(essayId);

    if (essay.status === EssayStatus.PRIVATE)
      throw new HttpException('Bad request.', HttpStatus.BAD_REQUEST);

    const existingBookmark = await this.bookmarkRepository.findBookmark(user, essay);

    if (existingBookmark) {
      throw new HttpException('Bookmark already exists.', HttpStatus.CONFLICT);
    }

    await this.bookmarkRepository.addBookmark(user, essay);
    await this.userService.increaseReputation(essay.author, 1);
    await this.essayService.increaseTrendScore(essay, 2);
  }

  @Transactional()
  async removeBookmarks(userId: number, essayIds: number[]) {
    const bookmarks = await this.bookmarkRepository.findBookmarks(userId, essayIds);

    const authorReputationMap: Record<number, number> = {};

    for (const bookmark of bookmarks) {
      const authorId = bookmark.essay.author.id;
      if (!authorReputationMap[authorId]) {
        authorReputationMap[authorId] = 0;
      }
      authorReputationMap[authorId] += 1;
    }

    for (const authorId of Object.keys(authorReputationMap)) {
      const pointsToDecrease = authorReputationMap[authorId];
      await this.userService.decreaseReputation(+authorId, pointsToDecrease);
    }

    await this.bookmarkRepository.removeBookmarks(bookmarks);
  }

  async resetBookmarks(userId: number) {
    const bookmarks = await this.bookmarkRepository.findAllBookmarks(userId);
    console.log(`Adding resetBookmarks job for user ${userId} with ${bookmarks.length} bookmarks`);
    await this.bookmarkQueue.add('resetBookmarks', { bookmarks });
  }

  async handleResetBookmarks(bookmarks: Bookmark[]) {
    const authorReputationMap: Record<number, number> = {};

    for (const bookmark of bookmarks) {
      const authorId = bookmark.essay.author.id;
      if (!authorReputationMap[authorId]) {
        authorReputationMap[authorId] = 0;
      }
      authorReputationMap[authorId] += 1;
      if (authorReputationMap[authorId] < 0) {
        authorReputationMap[authorId] = 0;
      }
    }

    for (const authorId of Object.keys(authorReputationMap)) {
      const pointsToDecrease = authorReputationMap[authorId];
      if (pointsToDecrease > 0) {
        console.log(`Decreasing reputation for author ${authorId} by ${pointsToDecrease} points`);
        await this.userService.decreaseReputation(+authorId, pointsToDecrease);
      } else {
        console.log(`Reputation for author ${authorId} is already zero or less. No decrease.`);
      }
    }

    console.log(`Removing ${bookmarks.length} bookmarks`);
    await this.bookmarkRepository.removeBookmarks(bookmarks);
  }

  async getBookmark(user: User, essay: Essay) {
    return await this.bookmarkRepository.findBookmark(user, essay);
  }
}
