import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ToolService } from '../../../utils/tool/core/tool.service';
import { EssayService } from '../../essay/core/essay.service';
import { AwsService } from '../../../adapters/aws/core/aws.service';
import { NicknameService } from '../../../utils/nickname/core/nickname.service';
import { UserResDto } from '../dto/response/userRes.dto';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { UpdateFullUserReqDto } from '../../admin/dto/request/updateFullUserReq.dto';
import { ProfileImageUrlResDto } from '../dto/response/profileImageUrlRes.dto';
import { UserSummaryResDto } from '../dto/response/userSummaryRes.dto';
import { User } from '../../../../entities/user.entity';
import { AuthService } from '../../auth/core/auth.service';
import { DeactivateReqDto } from '../dto/request/deacvivateReq.dto';
import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { Transactional } from 'typeorm-transactional';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Aggregate } from '../../../../entities/aggregate.entity';
import { IUserRepository } from '../infrastructure/iuser.repository';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly utilsService: ToolService,
    private readonly awsService: AwsService,
    private readonly nicknameService: NicknameService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
    @InjectQueue('user') private readonly userQueue: Queue,
  ) {}

  async fetchUserEntityById(userId: number): Promise<User> {
    const cacheKey = `user:${userId}`;
    const cachedUser = await this.redis.get(cacheKey);

    let user = cachedUser ? JSON.parse(cachedUser) : null;
    if (!user) {
      user = await this.userRepository.findUserById(userId);
      if (user) {
        await this.redis.setex(cacheKey, 3600, JSON.stringify(user));
        return user;
      }
    }

    return user;
  }

  async saveProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findUserById(userId);
    const newExt = file.originalname.split('.').pop();
    const defaultProfileImage = this.utilsService.isDefaultProfileImage(user.profileImage);

    let fileName: any;

    if (defaultProfileImage) {
      const imageName = this.utilsService.getUUID();
      fileName = `profile/${imageName}`;
    } else {
      const urlParts = user.profileImage.split('/').pop();
      fileName = `profile/${urlParts}`;
    }

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);
    user.profileImage = imageUrl;
    await this.userRepository.saveUser(user);
    await this.redis.del(`user:${userId}`);

    return this.utilsService.transformToDto(ProfileImageUrlResDto, { imageUrl });
  }

  async deleteProfileImage(userId: number) {
    const user = await this.userRepository.findUserById(userId);

    if (!user.profileImage) {
      throw new NotFoundException('No profile image to delete');
    }

    const urlParts = user.profileImage.split('/').pop();
    const fileName = `profile/${urlParts}`;

    await this.awsService.deleteImageFromS3(fileName);
    user.profileImage = null;
    await this.userRepository.saveUser(user);

    return { message: 'Profile image deleted successfully' };
  }

  async updateUser(userId: number, data: UpdateUserReqDto | UpdateFullUserReqDto) {
    const cacheKey = `user:${userId}`;
    const user = await this.fetchUserEntityById(userId);

    if (data.nickname && data.nickname !== user.nickname) {
      await this.authService.checkNickname(data.nickname);
      await this.nicknameService.setNicknameUsage(user.nickname, false);
      await this.nicknameService.setNicknameUsage(data.nickname, true);
    }

    if (data.email && data.email !== user.email) {
      await this.authService.checkEmail(data.email);
    }

    if (data.password && user.password && data.password !== user.password) {
      const isMatch = await bcrypt.compare(data.password, user.password);

      if (!isMatch) {
        data.password = await bcrypt.hash(data.password, 12);
      }
    }

    const updatedUser = await this.userRepository.updateUser(user, data);
    await this.redis.setex(cacheKey, 3600, JSON.stringify(updatedUser));

    return this.utilsService.transformToDto(UserResDto, updatedUser);
  }

  async findUserById(userId: number) {
    const user = await this.fetchUserEntityById(userId);
    return this.utilsService.transformToDto(UserResDto, user);
  }

  async getUserSummaryById(userId: number) {
    const user = await this.fetchUserEntityById(userId);

    const filteredUser = await this.userLayoutFilter(user);

    return this.utilsService.transformToDto(UserSummaryResDto, filteredUser);
  }

  async getUserProfile(userId: number) {
    const user = await this.getUserSummaryById(userId);
    const essayStats = await this.essayService.essayStatsByUserId(userId);

    return { user: user, essayStats: essayStats };
  }

  async getUserSummary(userId: number) {
    const userSummary = await this.getUserSummaryById(userId);
    const weeklyEssayCounts = await this.essayService.getWeeklyEssayCounts(userId);

    return { ...userSummary, weeklyEssayCounts: weeklyEssayCounts };
  }

  async increaseReputation(user: User, points: number) {
    const newReputation = user.reputation + points;
    await this.userRepository.increaseReputation(user.id, newReputation);
  }

  async decreaseReputation(userId: number, points: number) {
    const user = await this.fetchUserEntityById(userId);

    const currentReputation = user.reputation ?? 0;
    const newReputation = Math.max(currentReputation - points, 0);

    await this.userRepository.decreaseReputation(user.id, newReputation);
  }

  @Transactional()
  async requestDeactivation(userId: number, data: DeactivateReqDto) {
    const user = await this.fetchUserEntityById(userId);

    if (user.deactivationDate)
      throw new HttpException('이 계정은 이미 삭제 대기중입니다.', HttpStatus.BAD_REQUEST);

    user.deactivationDate = new Date();

    await this.userRepository.saveUser(user);

    const deactivationReasons = data.reasons.map((reason) => {
      const deactivationReason = new DeactivationReason();
      deactivationReason.user = user;
      deactivationReason.reason = reason;
      return deactivationReason;
    });

    await this.userRepository.saveDeactivationReasons(deactivationReasons);
  }

  async cancelDeactivation(userId: number) {
    const user = await this.userRepository.findUserById(userId);

    if (!user.deactivationDate)
      throw new HttpException('이 계정은 이미 활성상태 입니다.', HttpStatus.BAD_REQUEST);

    user.deactivationDate = null;

    await this.userRepository.saveUser(user);
  }

  @Transactional()
  async deleteAccount(userId: number) {
    const userIds = [userId];
    const todayDate = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
    await this.userRepository.deleteAccount(userId, todayDate);

    const batchSize = 5;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await this.userQueue.add(
        'deleteAccountEssaySync',
        { batch },
        {
          attempts: 5,
          backoff: 5000,
          delay: i * 3000,
        },
      );
    }
  }

  async getUserInfo(userId: number) {
    const user = await this.fetchUserEntityById(userId);

    const filteredUser = await this.userLayoutFilter(user);

    return this.utilsService.transformToDto(UserSummaryResDto, filteredUser);
  }

  async userLayoutFilter(user: User) {
    const activeLayout = (user.homeLayouts || []).find((layout) => layout.isActive);

    return {
      ...user,
      homeLayouts: activeLayout,
    };
  }

  async saveDeactivationReasons(deactivationReasons: DeactivationReason[]) {
    await this.userRepository.saveDeactivationReasons(deactivationReasons);
  }

  async checkEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (user) throw new HttpException('사용중인 이메일 입니다.', HttpStatus.CONFLICT);
    return true;
  }

  async checkNickname(nickname: string) {
    const user = await this.userRepository.findByNickname(nickname);
    if (user) throw new HttpException('사용중인 닉네임 입니다.', HttpStatus.CONFLICT);
    return true;
  }
}
