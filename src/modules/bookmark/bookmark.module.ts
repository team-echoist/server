import { Module } from '@nestjs/common';
import { Bookmark } from '../../entities/bookmark.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';
import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Essay, User]), UtilsModule],
  providers: [BookmarkService, BookmarkRepository],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
