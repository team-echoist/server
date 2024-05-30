import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UtilsService } from '../utils/utils.service';
import { EssayService } from '../essay/essay.service';
import { AwsService } from '../aws/aws.service';
import { FollowService } from '../follow/follow.service';
import { BadgeService } from '../badge/badge.service';
import { UserRepository } from './user.repository';
import { UserResDto } from './dto/response/userRes.dto';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { UpdateFullUserReqDto } from '../admin/dto/request/updateFullUserReq.dto';
import { ProfileImageResDto } from './dto/response/profileImageRes.dto';
import { UserInfoResDto } from './dto/response/userInfoRes.dto';
import { UserSummaryDto } from './dto/userSummary.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userRepository: UserRepository,
    private readonly followService: FollowService,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
    private readonly badgeService: BadgeService,
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
  ) {}

  async fetchUserEntityById(userId: number) {
    return this.userRepository.findUserById(userId);
  }

  async saveProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findUserById(userId);
    const newExt = file.originalname.split('.').pop();

    let fileName: any;
    if (user.profileImage) {
      const urlParts = user.profileImage.split('/');
      fileName = urlParts[urlParts.length - 1];
    } else {
      const imageName = this.utilsService.getUUID();
      fileName = `${imageName}`;
    }

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);
    user.profileImage = imageUrl;
    await this.userRepository.saveUser(user);

    return this.utilsService.transformToDto(ProfileImageResDto, { imageUrl });
  }

  async deleteProfileImage(userId: number) {
    const user = await this.userRepository.findUserById(userId);

    if (!user.profileImage) {
      throw new NotFoundException('No profile image to delete');
    }

    const urlParts = user.profileImage.split('/');
    const fileName = urlParts[urlParts.length - 1];

    await this.awsService.deleteImageFromS3(fileName);
    user.profileImage = null;
    await this.userRepository.saveUser(user);

    return { message: 'Profile image deleted successfully' };
  }

  async updateUser(userId: number, data: UpdateUserReqDto | UpdateFullUserReqDto) {
    const user = await this.userRepository.findUserById(userId);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updatedUser = await this.userRepository.updateUser(user, data);

    return this.utilsService.transformToDto(UserResDto, updatedUser);
  }

  async findUserById(userId: number) {
    const user = await this.userRepository.findUserById(userId);
    return this.utilsService.transformToDto(UserResDto, user);
  }

  async getUserSummaryById(userId: number) {
    const user = await this.userRepository.findUserById(userId);
    return this.utilsService.transformToDto(UserSummaryDto, user);
  }

  async getUserInfo(userId: number) {
    const user = await this.getUserSummaryById(userId);
    const essayStats = await this.essayService.essayStatsByUserId(userId);

    return this.utilsService.transformToDto(UserInfoResDto, { user, essayStats });
  }

  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new HttpException('You cannot follow yourself', HttpStatus.CONFLICT);
    }
    const followerRelation = await this.followService.findFollowerRelation(followerId, followingId);
    if (followerRelation) {
      throw new HttpException('You are already following', HttpStatus.CONFLICT);
    }

    const follower = await this.userRepository.findUserById(followerId);
    const following = await this.userRepository.findUserById(followingId);

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }
    await this.followService.follow(follower, following);
  }

  async unFollow(followerId: number, followingId: number) {
    await this.followService.unFollow(followerId, followingId);
  }

  async getFollowings(userId: number) {
    const followings = await this.followService.getFollowings(userId);
    const followingsDto = followings.map((follow) => {
      return this.utilsService.transformToDto(UserSummaryDto, follow.following);
    });
    return { followings: followingsDto };
  }

  async levelUpBadge(userId: number, badgeName: string) {
    return this.badgeService.levelUpBadge(userId, badgeName);
  }

  async getBadges(userId: number) {
    const badges = await this.badgeService.getBadges(userId);
    return { badges: badges };
  }

  async getBadgeWithTags(userId: number) {
    const badgesWithTags = await this.badgeService.getBadgeWithTags(userId);
    return { badges: badgesWithTags };
  }
}
