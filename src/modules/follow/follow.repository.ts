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

  async findFollowings(userId: number, page: number, limit: number) {
    const queryBuilder = this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'following')
      .where('follow.follower.id = :userId', { userId })
      .skip((page - 1) * limit)
      .take(limit);

    const [followings, total] = await queryBuilder.getManyAndCount();
    return { followings: followings, total };
  }

  async findAllFollowings(userId: number) {
    return await this.followRepository.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
  }
}
