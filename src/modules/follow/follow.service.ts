import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowRepository } from './follow.repository';
import { User } from '../../entities/user.entity';
import { UtilsService } from '../utils/utils.service';
import { UserSummaryResSchemaDto } from '../user/dto/schema/userSummaryResSchema.dto';

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

  async getFollowings(userId: number, page: number, limit: number) {
    const { followings, total } = await this.followRepository.findFollowings(userId, page, limit);
    return { followings: followings, total };
  }

  async getAllFollowings(userId: number) {
    return this.followRepository.findAllFollowings(userId);
  }
}
