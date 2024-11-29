import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ToolService } from '../../../../utils/tool/core/tool.service';
import { BadgeService } from '../core/badge.service';
import { BadgeRepository } from '../infrastructure/badge.repository';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../infrastructure/badge.repository');
jest.mock('../../../../utils/tool/core/tool.service');

describe('BadgeService', () => {
  let badgeService: BadgeService;
  let badgeRepository: jest.Mocked<BadgeRepository>;
  let utilsService: jest.Mocked<ToolService>;

  let user: any;
  let tag: any;
  let tags: any;
  let badge: any;
  let badges: any;
  let userBadges: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        { provide: BadgeRepository, useClass: BadgeRepository },
        { provide: ToolService, useClass: ToolService },
      ],
    }).compile();

    badgeService = module.get<BadgeService>(BadgeService);
    badgeRepository = module.get(BadgeRepository) as jest.Mocked<BadgeRepository>;
    utilsService = module.get(ToolService) as jest.Mocked<ToolService>;

    utilsService.transformToDto.mockImplementation((_, any) => any);

    user = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      nickname: null,
      platformId: null,
      platform: null,
      status: null,
      tokenVersion: 1,
    };
    tags = [
      { id: 1, name: 'tag1' },
      { id: 2, name: 'tag2' },
    ];
    badge = { id: 1, name: 'badge1', level: 1, exp: 1, userId: user.id };
    badges = [
      { id: 1, name: 'badge1', level: 2, exp: 5 },
      { id: 2, name: 'badge2', level: 1, exp: 10 },
    ];
    userBadges = [
      {
        id: 1,
        name: 'badge1',
        level: 2,
        exp: 5,
        tagExps: [{ tag: { id: 1, name: 'tag1' } }, { tag: { id: 2, name: 'tag2' } }],
      },
    ];
  });

  describe('addExperience', () => {
    it('뱃지 경험치증가', async () => {
      jest.spyOn(badgeService, 'findBadgeByTag').mockReturnValue('badge1');
      jest.spyOn(badgeService, 'hasUserUsedTag').mockResolvedValue(false);
      jest.spyOn(badgeService, 'incrementBadgeExperience').mockResolvedValue({
        name: 'badge1',
        exp: 10,
      } as any);
      jest.spyOn(badgeService, 'markTagAsUsed').mockResolvedValue(undefined);
    });
  });

  describe('levelUpBadge', () => {
    it('뱃지레벨업: 찾을 수 없음', async () => {
      badgeRepository.findBadge.mockResolvedValue(null);
      await expect(badgeService.levelUpBadge(user.id, badge.id)).rejects.toThrow(
        new HttpException('사용자의 뱃지를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );
    });

    it('뱃지레벨업: 경험치 부족', async () => {
      badgeRepository.findBadge.mockResolvedValue(badge);
      await expect(badgeService.levelUpBadge(user.id, badge.id)).rejects.toThrow(
        new HttpException('레벨업에 필요한 경험치가 부족합니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('뱃지레벨업: 레벨업', async () => {
      badge.exp = 10;
      badgeRepository.findBadge.mockResolvedValue(badge);

      await badgeService.levelUpBadge(user.id, badge.id);

      expect(badge.exp).toBe(0);
      expect(badge.level).toBe(2);
    });
  });

  describe('getBadges', () => {
    beforeEach(() => {
      badgeService.allBadges = ['badge1', 'badge2', 'badge3'];

      jest.clearAllMocks();
    });
    it('뱃지조회: 최초조회시 기본값 생성', async () => {
      badges = [];
      badgeRepository.findBadges.mockResolvedValue(badges);

      const result = await badgeService.getBadges(user.id);

      expect(badgeRepository.findBadges).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        badges: [
          { id: null, name: 'badge1', level: 0, exp: 0 },
          { id: null, name: 'badge2', level: 0, exp: 0 },
          { id: null, name: 'badge3', level: 0, exp: 0 },
        ],
      });
    });

    it('뱃지조회: 기존조회시 기존값 반환', async () => {
      badges = [
        { id: 1, name: 'badge1', level: 2, exp: 5 },
        { id: 2, name: 'badge2', level: 1, exp: 10 },
      ];

      badgeRepository.findBadges.mockResolvedValue(badges);

      const result = await badgeService.getBadges(user.id);

      expect(badgeRepository.findBadges).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        badges: [
          { id: 1, name: 'badge1', level: 2, exp: 5 },
          { id: 2, name: 'badge2', level: 1, exp: 10 },
          { id: null, name: 'badge3', level: 0, exp: 0 },
        ],
      });
    });
  });

  describe('getBadgeWithTags', () => {
    beforeEach(() => {
      badgeService.allBadges = ['badge1', 'badge2', 'badge3'];

      jest.clearAllMocks();
    });
    it('유저가 보유한 뱃지: 태그가 없는 경우', async () => {
      badgeRepository.findBadgesWithTags.mockResolvedValue(userBadges);

      const result = await badgeService.getBadgeWithTags(user.id);

      expect(badgeRepository.findBadgesWithTags).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        badges: [
          {
            id: 1,
            name: 'badge1',
            level: 2,
            exp: 5,
            tags: ['tag1', 'tag2'],
          },
          {
            id: null,
            name: 'badge2',
            level: 0,
            exp: 0,
            tags: [],
          },
          {
            id: null,
            name: 'badge3',
            level: 0,
            exp: 0,
            tags: [],
          },
        ],
      });
    });

    it('유저가 보유한 뱃지: 태그가 없는 경우', async () => {
      badgeRepository.findBadgesWithTags.mockResolvedValue([]);

      const result = await badgeService.getBadgeWithTags(user.id);

      expect(badgeRepository.findBadgesWithTags).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        badges: [
          {
            id: null,
            name: 'badge1',
            level: 0,
            exp: 0,
            tags: [],
          },
          {
            id: null,
            name: 'badge2',
            level: 0,
            exp: 0,
            tags: [],
          },
          {
            id: null,
            name: 'badge3',
            level: 0,
            exp: 0,
            tags: [],
          },
        ],
      });
    });
  });
});
