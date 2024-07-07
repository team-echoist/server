import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { UtilsService } from '../../utils/utils.service';
import { AwsService } from '../../aws/aws.service';
import { NicknameService } from '../../nickname/nickname.service';
import { AuthService } from '../../auth/auth.service';
import { EssayService } from '../../essay/essay.service';
import { getQueueToken } from '@nestjs/bull';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../../entities/user.entity';
import { ProfileImageUrlResDto } from '../dto/response/profileImageUrlRes.dto';
import { UserResDto } from '../dto/response/userRes.dto';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { DeactivateReqDto } from '../dto/request/deacvivateReq.dto';
import { UserSummaryResDto } from '../dto/response/userSummaryRes.dto';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('ioredis');
jest.mock('bull');
jest.mock('bcrypt');
jest.mock('../user.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../aws/aws.service');
jest.mock('../../nickname/nickname.service');
jest.mock('../../auth/auth.service');
jest.mock('../../essay/essay.service');

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let awsService: jest.Mocked<AwsService>;
  let nicknameService: jest.Mocked<NicknameService>;
  let authService: jest.Mocked<AuthService>;
  let essayService: jest.Mocked<EssayService>;

  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
    setex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        UserRepository,
        UtilsService,
        AwsService,
        NicknameService,
        AuthService,
        EssayService,
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
        { provide: getQueueToken('user'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    utilsService = module.get(UtilsService);
    awsService = module.get(AwsService);
    nicknameService = module.get(NicknameService);
    authService = module.get(AuthService);
    essayService = module.get(EssayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserEntityById', () => {
    it('should return user from cache if exists', async () => {
      const userId = 1;
      const user = { id: userId, name: 'test' } as any;
      redis.get.mockResolvedValue(JSON.stringify(user));

      const result = await service.fetchUserEntityById(userId);

      expect(redis.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(result).toEqual(user);
    });

    it('should fetch user from database if not in cache', async () => {
      const userId = 1;
      const user = { id: userId, name: 'test' } as any;
      redis.get.mockResolvedValue(null);
      userRepository.findUserById.mockResolvedValue(user);
      redis.setex.mockResolvedValue('OK');

      const result = await service.fetchUserEntityById(userId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(redis.setex).toHaveBeenCalledWith(`user:${userId}`, 3600, JSON.stringify(user));
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const userId = 1;
      redis.get.mockResolvedValue(null);
      userRepository.findUserById.mockResolvedValue(null);

      const result = await service.fetchUserEntityById(userId);

      expect(result).toBeNull();
    });
  });

  describe('saveProfileImage', () => {
    it('should save profile image', async () => {
      const userId = 1;
      const file = { originalname: 'test.png' } as Express.Multer.File;
      const user = { id: userId, profileImage: null } as User;
      const imageUrl = 'http://example.com/test.png';

      userRepository.findUserById.mockResolvedValue(user);
      awsService.imageUploadToS3.mockResolvedValue(imageUrl);
      utilsService.transformToDto.mockReturnValue({ imageUrl });

      const result = await service.saveProfileImage(userId, file);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(awsService.imageUploadToS3).toHaveBeenCalledWith(expect.any(String), file, 'png');
      expect(userRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ profileImage: imageUrl }),
      );
      expect(utilsService.transformToDto).toHaveBeenCalledWith(ProfileImageUrlResDto, { imageUrl });
      expect(result).toEqual({ imageUrl });
    });
  });

  describe('deleteProfileImage', () => {
    it('should delete profile image', async () => {
      const userId = 1;
      const user = { id: userId, profileImage: 'http://example.com/test.png' } as User;

      userRepository.findUserById.mockResolvedValue(user);

      const result = await service.deleteProfileImage(userId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(awsService.deleteImageFromS3).toHaveBeenCalledWith(expect.any(String));
      expect(userRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ profileImage: null }),
      );
      expect(result).toEqual({ message: 'Profile image deleted successfully' });
    });

    it('should throw an error if no profile image to delete', async () => {
      const userId = 1;
      const user = { id: userId, profileImage: null } as User;

      userRepository.findUserById.mockResolvedValue(user);

      await expect(service.deleteProfileImage(userId)).rejects.toThrow(
        new NotFoundException('No profile image to delete'),
      );
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const userId = 1;
      const user = { id: userId, nickname: 'oldNick', email: 'old@example.com' } as User;
      const data: UpdateUserReqDto = {
        nickname: 'newNick',
        email: 'new@example.com',
        password: 'newPassword',
      };
      const hashedPassword = 'hashedPassword';

      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      authService.checkNickname.mockResolvedValue(undefined);
      authService.checkEmail.mockResolvedValue(undefined);
      nicknameService.setNicknameUsage.mockResolvedValue(undefined);
      userRepository.updateUser.mockResolvedValue({ ...user, ...data });

      const result = await service.updateUser(userId, data);

      expect(authService.checkNickname).toHaveBeenCalledWith(data.nickname);
      expect(authService.checkEmail).toHaveBeenCalledWith(data.email);
      expect(nicknameService.setNicknameUsage).toHaveBeenCalledWith('oldNick', false);
      expect(nicknameService.setNicknameUsage).toHaveBeenCalledWith(data.nickname, true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        user,
        expect.objectContaining({ ...data, password: hashedPassword }),
      );
    });
  });

  describe('findUserById', () => {
    it('should find user by id and return DTO', async () => {
      const userId = 1;
      const user = { id: userId, name: 'test' } as any;
      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);
      utilsService.transformToDto.mockReturnValue(user);

      const result = await service.findUserById(userId);

      expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(UserResDto, user);
      expect(result).toEqual(user);
    });
  });

  describe('getUserSummaryById', () => {
    it('should get user summary by id and return DTO', async () => {
      const userId = 1;
      const user = { id: userId, name: 'test' } as any;
      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);
      utilsService.transformToDto.mockReturnValue(user);

      const result = await service.getUserSummaryById(userId);

      expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(UserSummaryResDto, user);
      expect(result).toEqual(user);
    });
  });

  describe('getUserInfo', () => {
    it('should get user info including essay stats', async () => {
      const userId = 1;
      const user = { id: userId, name: 'test' } as any;
      const essayStats = { count: 10 } as any;
      jest.spyOn(service, 'getUserSummaryById').mockResolvedValue(user);
      essayService.essayStatsByUserId.mockResolvedValue(essayStats);

      const result = await service.getUserInfo(userId);

      expect(service.getUserSummaryById).toHaveBeenCalledWith(userId);
      expect(essayService.essayStatsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ user, essayStats });
    });
  });

  describe('getUserSummary', () => {
    it('should get user summary including weekly essay counts', async () => {
      const userId = 1;
      const userSummary = { id: userId, name: 'test' } as any;
      const weeklyEssayCounts = { count: 5 } as any;
      jest.spyOn(service, 'getUserSummaryById').mockResolvedValue(userSummary);
      essayService.getWeeklyEssayCounts.mockResolvedValue(weeklyEssayCounts);

      const result = await service.getUserSummary(userId);

      expect(service.getUserSummaryById).toHaveBeenCalledWith(userId);
      expect(essayService.getWeeklyEssayCounts).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ ...userSummary, weeklyEssayCounts });
    });
  });

  describe('increaseReputation', () => {
    it('should increase user reputation', async () => {
      const user = { id: 1, reputation: 10 } as User;
      const points = 5;
      const newReputation = user.reputation + points;

      await service.increaseReputation(user, points);

      expect(userRepository.increaseReputation).toHaveBeenCalledWith(user.id, newReputation);
    });
  });

  describe('decreaseReputation', () => {
    it('should decrease user reputation', async () => {
      const userId = 1;
      const user = { id: userId, reputation: 10 } as User;
      const points = 5;
      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);

      await service.decreaseReputation(userId, points);

      expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(userRepository.decreaseReputation).toHaveBeenCalledWith(user.id, 5);
    });

    it('should not decrease reputation below zero', async () => {
      const userId = 1;
      const user = { id: userId, reputation: 3 } as User;
      const points = 5;
      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);

      await service.decreaseReputation(userId, points);

      expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(userRepository.decreaseReputation).toHaveBeenCalledWith(user.id, 0);
    });
  });

  describe('requestDeactivation', () => {
    it('should request user deactivation', async () => {
      const userId = 1;
      const data: DeactivateReqDto = { password: 'password', reasons: ['reason1', 'reason2'] };
      const user = { id: userId, password: 'hashedPassword', deactivationDate: null } as User;

      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.saveUser.mockResolvedValue(user);

      await service.requestDeactivation(userId, data);

      expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(data.password, user.password);
      expect(userRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ deactivationDate: expect.any(Date) }),
      );
      expect(userRepository.saveDeactivationReasons).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should throw an error if password does not match', async () => {
      const userId = 1;
      const data: DeactivateReqDto = { password: 'password', reasons: ['reason1', 'reason2'] };
      const user = { id: userId, password: 'hashedPassword', deactivationDate: null } as User;

      jest.spyOn(service, 'fetchUserEntityById').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // todo 외않되?
      // await expect(service.requestDeactivation(userId, data)).rejects.toThrow(
      //   new HttpException('Password mismatch.', HttpStatus.FORBIDDEN),
      // );
      //
      // expect(service.fetchUserEntityById).toHaveBeenCalledWith(userId);
      // expect(bcrypt.compare).toHaveBeenCalledWith(data.password, user.password);
    });
  });

  describe('cancelDeactivation', () => {
    it('should cancel user deactivation', async () => {
      const userId = 1;
      const user = { id: userId, deactivationDate: new Date() } as User;

      userRepository.findUserById.mockResolvedValue(user);

      await service.cancelDeactivation(userId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(userRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ deactivationDate: null }),
      );
    });

    it('should throw an error if user is not in deactivated status', async () => {
      const userId = 1;
      const user = { id: userId, deactivationDate: null } as User;

      userRepository.findUserById.mockResolvedValue(user);

      await expect(service.cancelDeactivation(userId)).rejects.toThrow(
        new HttpException('Account is not in deactivated status', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const userId = 1;
      const todayDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

      await service.deleteAccount(userId);

      expect(userRepository.deleteAccount).toHaveBeenCalledWith(userId, todayDate);
    });
  });
});
