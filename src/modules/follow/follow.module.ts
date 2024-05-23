import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Follow } from '../../entities/follow.entity';
import { FollowService } from './follow.service';
import { FollowRepository } from './follow.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow])],
  providers: [FollowService, FollowRepository],
  exports: [FollowService, FollowRepository],
})
export class FollowModule {}
