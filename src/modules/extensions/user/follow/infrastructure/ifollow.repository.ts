import { Follow } from '../../../../../entities/follow.entity';
import { User } from '../../../../../entities/user.entity';

export interface IFollowRepository {
  follow(follower: User, following: User): Promise<void>;

  findFollowerRelation(followerId: number, followingId: number): Promise<Follow>;

  unFollow(followData: Follow): Promise<void>;

  findFollowings(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ followings: Follow[]; total: number }>;

  findAllFollowings(userId: number): Promise<Follow[]>;
}
