import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BookmarkRepository } from './bookmark.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Bookmark } from '../../entities/bookmark.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectQueue('bookmark') private readonly bookmarkQueue: Queue,
  ) {}

  async getUserBookmarks(userId: number, page: number, limit: number) {
    return await this.bookmarkRepository.findUserBookmarks(userId, page, limit);
  }

  async addBookmark(user: User, essay: Essay) {
    return this.bookmarkRepository.addBookmark(user, essay);
  }

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

    return await this.bookmarkRepository.removeBookmarks(bookmarks);
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
