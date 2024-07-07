import { Test, TestingModule } from '@nestjs/testing';
import { BadgeService } from '../badge.service';
import { BadgeRepository } from '../badge.repository';
import { UtilsService } from '../../utils/utils.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../../../entities/user.entity';
import { Tag } from '../../../entities/tag.entity';
import { Badge } from '../../../entities/badge.entity';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../badge.repository');
jest.mock('../../utils/utils.service');

describe('BadgeService', () => {
  let service: BadgeService;
  let badgeRepository: jest.Mocked<BadgeRepository>;
  let utilsService: jest.Mocked<UtilsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeService, BadgeRepository, UtilsService],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
    badgeRepository = module.get(BadgeRepository);
    utilsService = module.get(UtilsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addExperience', () => {
    it('should add experience to the badge for the user', async () => {
      const user: User = { id: 1 } as User;
      const tags: Tag[] = [{ id: 1, name: '열받는' }] as Tag[];
      const badge: Badge = { id: 1, name: 'angry', exp: 1, level: 0 } as Badge;

      badgeRepository.findUsedTag.mockResolvedValue(null);
      badgeRepository.findByBadgeName.mockResolvedValue(null);
      badgeRepository.createBadge.mockResolvedValue(badge);
      badgeRepository.saveBadge.mockResolvedValue(badge);
      badgeRepository.saveUsedTag.mockResolvedValue();

      await service.addExperience(user, tags);

      expect(badgeRepository.findUsedTag).toHaveBeenCalledWith(user.id, tags[0]);
      expect(badgeRepository.findByBadgeName).toHaveBeenCalledWith(user.id, 'angry');
      expect(badgeRepository.createBadge).toHaveBeenCalledWith(user.id, 'angry');
      expect(badgeRepository.saveBadge).toHaveBeenCalledWith(badge);
      expect(badgeRepository.saveUsedTag).toHaveBeenCalledWith(user.id, tags[0], badge);
    });
  });

  describe('levelUpBadge', () => {
    it('should level up the badge if enough experience is available', async () => {
      const userId = 1;
      const badgeId = 1;
      const badge: Badge = { id: badgeId, name: 'angry', exp: 10, level: 1 } as Badge;

      badgeRepository.findBadge.mockResolvedValue(badge);
      badgeRepository.saveBadge.mockResolvedValue(badge);

      await service.levelUpBadge(userId, badgeId);

      expect(badgeRepository.findBadge).toHaveBeenCalledWith(userId, badgeId);
      expect(badge.exp).toBe(0);
      expect(badge.level).toBe(2);
      expect(badgeRepository.saveBadge).toHaveBeenCalledWith(badge);
    });

    it('should throw an error if not enough experience', async () => {
      const userId = 1;
      const badgeId = 1;
      const badge: Badge = { id: badgeId, name: 'angry', exp: 5, level: 1 } as Badge;

      badgeRepository.findBadge.mockResolvedValue(badge);

      await expect(service.levelUpBadge(userId, badgeId)).rejects.toThrow(
        new HttpException('Not enough experience to level up.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an error if badge not found', async () => {
      const userId = 1;
      const badgeId = 1;

      badgeRepository.findBadge.mockResolvedValue(null);

      await expect(service.levelUpBadge(userId, badgeId)).rejects.toThrow(
        new HttpException('Badge not found for user.', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getBadges', () => {
    it('should return all badges with default values if user has no badges', async () => {
      const userId = 1;
      const allBadges = service['allBadges'];
      const userBadges = allBadges.map((name) => ({
        id: null,
        name,
        level: 0,
        exp: 0,
      }));

      badgeRepository.findBadges.mockResolvedValue([]);
      utilsService.transformToDto.mockReturnValue(userBadges);

      const result = await service.getBadges(userId);

      expect(badgeRepository.findBadges).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), userBadges);
      expect(result).toEqual({ badges: userBadges });
    });
  });

  describe('getBadgeWithTags', () => {
    it('should return all badges with tags and default values if user has no badges', async () => {
      const userId = 1;
      const allBadges = service['allBadges'];
      const userBadges = allBadges.map((name) => ({
        id: null,
        name,
        level: 0,
        exp: 0,
        tags: [],
      }));

      badgeRepository.findBadgesWithTags.mockResolvedValue([]);
      utilsService.transformToDto.mockReturnValue(userBadges);

      const result = await service.getBadgeWithTags(userId);

      expect(badgeRepository.findBadgesWithTags).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), userBadges);
      expect(result).toEqual({ badges: userBadges });
    });
  });
});
