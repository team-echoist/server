import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowRepository } from './follow.repository';
import { UtilsService } from '../utils/utils.service';
import { UserSummaryResDto } from '../user/dto/response/userSummaryRes.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new HttpException('You cannot follow yourself', HttpStatus.CONFLICT);
    }

    const followerRelation = await this.findFollowerRelation(followerId, followingId);
    if (followerRelation) {
      throw new HttpException('You are already following', HttpStatus.CONFLICT);
    }

    const follower = await this.userService.fetchUserEntityById(followerId);
    const following = await this.userService.fetchUserEntityById(followingId);

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
    const totalPage: number = Math.ceil(total / limit);

    const followingsDto = followings.map((follow) => {
      return this.utilsService.transformToDto(UserSummaryResDto, follow.following);
    });
    return { followings: followingsDto, total, totalPage, page };
  }

  async getAllFollowings(userId: number) {
    return this.followRepository.findAllFollowings(userId);
  }
}
