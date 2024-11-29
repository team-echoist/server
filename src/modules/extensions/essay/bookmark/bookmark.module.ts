import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EssayModule } from '../../../base/essay/essay.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkController } from './api/bookmark.controller';
import { BookmarkProcessor } from './core/bookmark.processor';
import { BookmarkService } from './core/bookmark.service';
import { BookmarkRepository } from './infrastructure/bookmark.repository';
import { Bookmark } from '../../../../entities/bookmark.entity';
import { Essay } from '../../../../entities/essay.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [
    JwtModule.register({}),
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
    ToolModule,
    forwardRef(() => UserModule),
    forwardRef(() => EssayModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService, BookmarkRepository, BookmarkProcessor],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
