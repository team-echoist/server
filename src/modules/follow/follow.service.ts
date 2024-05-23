import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowRepository } from './follow.repository';
import { User } from '../../entities/user.entity';
@Injectable()
export class FollowService {
  constructor(private readonly followRepository: FollowRepository) {}

  async follow(follower: User, following: User) {
    await this.followRepository.follow(follower, following);
  }

  async unFollow(followerId: number, followingId: number) {
    const followData = await this.followRepository.findFollowerRelation(followerId, followingId);
    if (!followData) {
      throw new NotFoundException('Follow relationship not found');
    }
    await this.followRepository.unFollow(followData);
  }
}
