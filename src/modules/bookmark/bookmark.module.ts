import { Module } from '@nestjs/common';
import { Bookmark } from '../../entities/bookmark.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { BullModule } from '@nestjs/bull';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';
import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';
import { UserModule } from '../user/user.module';
import { BookmarkProcessor } from './bookmark.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookmark, Essay, User]),
    BullModule.registerQueue({
      name: 'bookmark',
      redis: {
        host: 'localhost', // Redis 서버 호스트명
        port: 6379, // Redis 서버 포트
      },
    }),
    UtilsModule,
    UserModule,
  ],
  providers: [BookmarkService, BookmarkRepository, BookmarkProcessor],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
