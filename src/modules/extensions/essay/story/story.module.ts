import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoryController } from './api/story.controller';
import { StoryService } from './core/story.service';
import { StoryRepository } from './infrastructure/story.repository';
import { Story } from '../../../../entities/story.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { EssayModule } from '../../../base/essay/essay.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Story]),
    ToolModule,
    forwardRef(() => UserModule),
    forwardRef(() => EssayModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [StoryController],
  providers: [StoryService, { provide: 'IStoryRepository', useClass: StoryRepository }],
  exports: [StoryService, { provide: 'IStoryRepository', useClass: StoryRepository }],
})
export class StoryModule {}
