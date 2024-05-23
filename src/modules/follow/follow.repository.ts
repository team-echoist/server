import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from '../../entities/follow.entity';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

export class FollowRepository {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async follow(follower: User, following: User) {
    const followData = this.followRepository.create({ follower, following });
    await this.followRepository.save(followData);
  }

  async findFollowerRelation(followerId: number, followingId: number) {
    return await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });
  }

  async unFollow(followData: Follow) {
    await this.followRepository.remove(followData);
  }
}
