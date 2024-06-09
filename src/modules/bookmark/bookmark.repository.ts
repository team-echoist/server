import { InjectRepository } from '@nestjs/typeorm';
import { Bookmark } from '../../entities/bookmark.entity';
import { Repository } from 'typeorm';
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
      .where('bookmark.user.id = :userId', { userId })
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

  async removeBookmark(userId: number, essayId: number) {
    return this.bookmarkRepository.delete({ user: { id: userId }, essay: { id: essayId } });
  }
}
