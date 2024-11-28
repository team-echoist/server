import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowRepository } from './follow.repository';
import { ToolService } from '../../../utils/tool/tool.service';
import { UserSummaryResDto } from '../../../base/user/dto/response/userSummaryRes.dto';
import { UserService } from '../../../base/user/user.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly utilsService: ToolService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  @Transactional()
  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new HttpException('너무 자애롭습니다.', HttpStatus.CONFLICT);
    }

    const followerRelation = await this.findFollowerRelation(followerId, followingId);
    if (followerRelation) {
      throw new HttpException('이미 팔로우중입니다.', HttpStatus.CONFLICT);
    }

    const follower = await this.userService.fetchUserEntityById(followerId);
    const following = await this.userService.fetchUserEntityById(followingId);

    if (!following) throw new HttpException('대상을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

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
