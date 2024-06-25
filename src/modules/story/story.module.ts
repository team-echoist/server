import { forwardRef, Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryRepository } from './story.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../../entities/story.entity';
import { UtilsModule } from '../utils/utils.module';
import { UserModule } from '../user/user.module';
import { EssayModule } from '../essay/essay.module';
import { StoryController } from './story.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story]),
    UtilsModule,
    forwardRef(() => UserModule),
    forwardRef(() => EssayModule),
  ],
  controllers: [StoryController],
  providers: [StoryService, StoryRepository],
  exports: [StoryService, StoryRepository],
})
export class StoryModule {}
