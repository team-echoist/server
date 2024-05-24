import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowRepository } from './follow.repository';
import { User } from '../../entities/user.entity';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly utilsService: UtilsService,
  ) {}

  async follow(follower: User, following: User) {
    await this.followRepository.follow(follower, following);
  }

  async unFollow(followerId: number, followingId: number) {
    const followData = await this.findFollowerRelation(followerId, followingId);
    if (!followData) {
      throw new NotFoundException('Follow relationship not found');
    }
    await this.followRepository.unFollow(followData);
  }

  async findFollowerRelation(followerId: number, followingId: number) {
    return await this.followRepository.findFollowerRelation(followerId, followingId);
  }

  async getFollowings(userId: number) {
    return await this.followRepository.findFollowings(userId);
  }
}
