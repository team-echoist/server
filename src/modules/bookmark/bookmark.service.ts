import { Injectable } from '@nestjs/common';
import { BookmarkRepository } from './bookmark.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';

@Injectable()
export class BookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async getUserBookmarks(userId: number, page: number, limit: number) {
    return await this.bookmarkRepository.findUserBookmarks(userId, page, limit);
  }

  async addBookmark(user: User, essay: Essay) {
    return this.bookmarkRepository.addBookmark(user, essay);
  }

  async removeBookmark(userId: number, essayId: number) {
    return this.bookmarkRepository.removeBookmark(userId, essayId);
  }
}
