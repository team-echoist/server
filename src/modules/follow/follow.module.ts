import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Follow } from '../../entities/follow.entity';
import { FollowService } from './follow.service';
import { FollowRepository } from './follow.repository';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow]), UtilsModule],
  providers: [FollowService, FollowRepository],
  exports: [FollowService, FollowRepository],
})
export class FollowModule {}
