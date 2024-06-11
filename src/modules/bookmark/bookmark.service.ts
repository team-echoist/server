import { Injectable } from '@nestjs/common';
import { BookmarkRepository } from './bookmark.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class BookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async getUserBookmarks(userId: number, page: number, limit: number) {
    return await this.bookmarkRepository.findUserBookmarks(userId, page, limit);
  }

  async addBookmark(user: User, essay: Essay) {
    return this.bookmarkRepository.addBookmark(user, essay);
  }

  @Transactional()
  async removeBookmarks(userId: number, essayIds: number[]) {
    return this.bookmarkRepository.removeBookmarks(userId, essayIds);
  }

  @Transactional()
  async resetBookmarks(userId: number) {
    return this.bookmarkRepository.resetBookmarks(userId);
  }
}
