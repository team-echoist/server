import { forwardRef, Module } from '@nestjs/common';
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
import { BookmarkController } from './bookmark.controller';
import { EssayModule } from '../essay/essay.module';

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
        prefix: '{bull}',
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    UtilsModule,
    UserModule,
    forwardRef(() => EssayModule),
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService, BookmarkRepository, BookmarkProcessor],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
