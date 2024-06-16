import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bookmark } from '../../entities/bookmark.entity';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';

export class BookmarkRepository {
  constructor(
    @InjectRepository(Bookmark) private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  async findUserBookmarks(userId: number, page: number, limit: number) {
    const queryBuilder = this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .leftJoinAndSelect('bookmark.essay', 'essay')
      .where('bookmark.user_id = :userId', { userId })
      .orderBy('bookmark.createdDate', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [bookmarks, total] = await queryBuilder.getManyAndCount();

    return { bookmarks, total };
  }

  async addBookmark(user: User, essay: Essay) {
    const bookmark = this.bookmarkRepository.create({ user, essay });
    return this.bookmarkRepository.save(bookmark);
  }

  async findBookmarks(userId: number, essayIds: number[]) {
    return this.bookmarkRepository.find({
      where: {
        user: { id: userId },
        essay: { id: In(essayIds) },
      },
      relations: ['essay', 'essay.author'],
    });
  }

  async findAllBookmarks(userId: number) {
    return this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .innerJoinAndSelect('bookmark.essay', 'essay')
      .innerJoinAndSelect('essay.author', 'author')
      .where('bookmark.user.id = :userId', { userId })
      .getMany();
  }

  async removeBookmarks(bookmarks: Bookmark[]) {
    return this.bookmarkRepository.remove(bookmarks);
  }

  async findBookmark(user: User, essay: Essay) {
    return this.bookmarkRepository.findOne({
      where: {
        user: { id: user.id },
        essay: { id: essay.id },
      },
    });
  }
}
