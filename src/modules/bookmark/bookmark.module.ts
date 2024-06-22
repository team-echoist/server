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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookmark, Essay, User]),
    BullModule.registerQueueAsync({
      name: 'bookmark',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    UtilsModule,
    UserModule,
  ],
  providers: [BookmarkService, BookmarkRepository, BookmarkProcessor],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
