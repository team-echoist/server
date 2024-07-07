import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from '../follow.service';
import { FollowRepository } from '../follow.repository';
import { UtilsService } from '../../utils/utils.service';
import { UserService } from '../../user/user.service';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { User } from '../../../entities/user.entity';
import { UserSummaryResDto } from '../../user/dto/response/userSummaryRes.dto';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

jest.mock('../follow.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../user/user.service');

describe('FollowService', () => {
  let service: FollowService;
  let followRepository: jest.Mocked<FollowRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowService, FollowRepository, UtilsService, UserService],
    }).compile();

    service = module.get<FollowService>(FollowService);
    followRepository = module.get(FollowRepository);
    utilsService = module.get(UtilsService);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should follow a user', async () => {
      const followerId = 1;
      const followingId = 2;
      const follower = { id: followerId } as User;
      const following = { id: followingId } as User;

      followRepository.findFollowerRelation.mockResolvedValue(null);
      userService.fetchUserEntityById.mockResolvedValueOnce(follower);
      userService.fetchUserEntityById.mockResolvedValueOnce(following);

      await service.follow(followerId, followingId);

      expect(followRepository.findFollowerRelation).toHaveBeenCalledWith(followerId, followingId);
      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(followerId);
      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(followingId);
      expect(followRepository.follow).toHaveBeenCalledWith(follower, following);
    });

    it('should throw an error if trying to follow oneself', async () => {
      const followerId = 1;
      const followingId = 1;

      await expect(service.follow(followerId, followingId)).rejects.toThrow(
        new HttpException('You cannot follow yourself', HttpStatus.CONFLICT),
      );
    });

    it('should throw an error if already following', async () => {
      const followerId = 1;
      const followingId = 2;
      const followerRelation = { id: 1 } as any;

      followRepository.findFollowerRelation.mockResolvedValue(followerRelation);

      await expect(service.follow(followerId, followingId)).rejects.toThrow(
        new HttpException('You are already following', HttpStatus.CONFLICT),
      );

      expect(followRepository.findFollowerRelation).toHaveBeenCalledWith(followerId, followingId);
    });
  });

  describe('unFollow', () => {
    it('should unfollow a user', async () => {
      const followerId = 1;
      const followingId = 2;
      const followData = { id: 1 } as any;

      followRepository.findFollowerRelation.mockResolvedValue(followData);

      await service.unFollow(followerId, followingId);

      expect(followRepository.findFollowerRelation).toHaveBeenCalledWith(followerId, followingId);
      expect(followRepository.unFollow).toHaveBeenCalledWith(followData);
    });

    it('should throw an error if follow relationship not found', async () => {
      const followerId = 1;
      const followingId = 2;

      followRepository.findFollowerRelation.mockResolvedValue(null);

      await expect(service.unFollow(followerId, followingId)).rejects.toThrow(
        new NotFoundException('Follow relationship not found'),
      );

      expect(followRepository.findFollowerRelation).toHaveBeenCalledWith(followerId, followingId);
    });
  });

  describe('findFollowerRelation', () => {
    it('should return follower relation', async () => {
      const followerId = 1;
      const followingId = 2;
      const followerRelation = { id: 1 } as any;

      followRepository.findFollowerRelation.mockResolvedValue(followerRelation);

      const result = await service.findFollowerRelation(followerId, followingId);

      expect(followRepository.findFollowerRelation).toHaveBeenCalledWith(followerId, followingId);
      expect(result).toBe(followerRelation);
    });
  });

  describe('getFollowings', () => {
    it('should return followings', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const followings = [{ following: { id: 2 } }] as any[];
      const total = 1;

      followRepository.findFollowings.mockResolvedValue({ followings, total });
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getFollowings(userId, page, limit);

      expect(followRepository.findFollowings).toHaveBeenCalledWith(userId, page, limit);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(
        UserSummaryResDto,
        followings[0].following,
      );
      expect(result).toEqual({
        followings: followings.map((f) => f.following),
        total,
        totalPage: Math.ceil(total / limit),
        page,
      });
    });
  });

  describe('getAllFollowings', () => {
    it('should return all followings', async () => {
      const userId = 1;
      const followings = [{ id: 2 }] as any[];

      followRepository.findAllFollowings.mockResolvedValue(followings);

      const result = await service.getAllFollowings(userId);

      expect(followRepository.findAllFollowings).toHaveBeenCalledWith(userId);
      expect(result).toBe(followings);
    });
  });
});
