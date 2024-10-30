import { Test, TestingModule } from '@nestjs/testing';
import { EssayService } from '../essay.service';
import { EssayRepository } from '../essay.repository';
import { UtilsService } from '../../utils/utils.service';
import { AwsService } from '../../aws/aws.service';
import { ReviewService } from '../../review/review.service';
import { StoryService } from '../../story/story.service';
import { UserService } from '../../user/user.service';
import { TagService } from '../../tag/tag.service';
import { FollowService } from '../../follow/follow.service';
import { BadgeService } from '../../badge/badge.service';
import { ViewService } from '../../view/view.service';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { AlertService } from '../../alert/alert.service';
import { getQueueToken } from '@nestjs/bull';
import { Essay } from '../../../entities/essay.entity';
import { User } from '../../../entities/user.entity';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { EssayResDto } from '../dto/response/essayRes.dto';
import { SummaryEssayResDto } from '../dto/response/summaryEssayRes.dto';
import { WeeklyEssayCountResDto } from '../dto/response/weeklyEssayCountRes.dto';
import { ThumbnailResDto } from '../dto/response/ThumbnailRes.dto';
import { EssayStatsDto } from '../dto/essayStats.dto';
import { Story } from '../../../entities/story.entity';
import { SupportService } from '../../support/support.service';
import { SupportRepository } from '../../support/support.repository';
import { PageType, EssayStatus, UserStatus } from '../../../common/types/enum.types';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('ioredis');
jest.mock('bull');
jest.mock('../essay.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../aws/aws.service');
jest.mock('../../review/review.service');
jest.mock('../../story/story.service');
jest.mock('../../user/user.service');
jest.mock('../../tag/tag.service');
jest.mock('../../follow/follow.service');
jest.mock('../../badge/badge.service');
jest.mock('../../view/view.service');
jest.mock('../../bookmark/bookmark.service');
jest.mock('../../alert/alert.service');
jest.mock('../../support/support.service');

describe('EssayService', () => {
  let essayService: EssayService;
  let essayRepository: jest.Mocked<EssayRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let awsService: jest.Mocked<AwsService>;
  let reviewService: jest.Mocked<ReviewService>;
  let storyService: jest.Mocked<StoryService>;
  let userService: jest.Mocked<UserService>;
  let tagService: jest.Mocked<TagService>;
  let followService: jest.Mocked<FollowService>;
  let badgeService: jest.Mocked<BadgeService>;
  let viewService: jest.Mocked<ViewService>;
  let bookmarkService: jest.Mocked<BookmarkService>;
  let alertService: jest.Mocked<AlertService>;
  let supportService: jest.Mocked<SupportService>;

  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
    setex: jest.fn(),
  };

  let user: any;
  let essay: any;
  let essays: any;
  let req: any;

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssayService,
        { provide: EssayRepository, useClass: EssayRepository },
        { provide: UtilsService, useClass: UtilsService },

        { provide: AwsService, useClass: AwsService },
        { provide: ReviewService, useClass: ReviewService },
        { provide: StoryService, useClass: StoryService },
        { provide: UserService, useClass: UserService },
        { provide: TagService, useClass: TagService },
        { provide: FollowService, useClass: FollowService },
        { provide: BadgeService, useClass: BadgeService },
        { provide: ViewService, useClass: ViewService },
        { provide: BookmarkService, useClass: BookmarkService },
        { provide: AlertService, useClass: AlertService },
        { provide: SupportService, useClass: SupportService },
        {
          provide: getQueueToken('bookmark'),
          useValue: { add: jest.fn() },
        },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    essayService = module.get<EssayService>(EssayService);
    essayRepository = module.get(EssayRepository) as jest.Mocked<EssayRepository>;
    utilsService = module.get(UtilsService) as jest.Mocked<UtilsService>;
    awsService = module.get(AwsService) as jest.Mocked<AwsService>;
    reviewService = module.get(ReviewService) as jest.Mocked<ReviewService>;
    storyService = module.get(StoryService) as jest.Mocked<StoryService>;
    userService = module.get(UserService) as jest.Mocked<UserService>;
    tagService = module.get(TagService) as jest.Mocked<TagService>;
    followService = module.get(FollowService) as jest.Mocked<FollowService>;
    badgeService = module.get(BadgeService) as jest.Mocked<BadgeService>;
    viewService = module.get(ViewService) as jest.Mocked<ViewService>;
    bookmarkService = module.get(BookmarkService) as jest.Mocked<BookmarkService>;
    alertService = module.get(AlertService) as jest.Mocked<AlertService>;
    supportService = module.get(SupportService) as jest.Mocked<SupportService>;
  });

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

  req = { ip: '127.0.0.1', user, device: 'device123' };

  essay = { id: 1, title: '에세이1', content: '내용1', author: user };

  essays = [
    { essay },
    {
      id: 2,
      title: '에세이2',
      content: '내용2',
      author: user,
    },
    {
      id: 3,
      title: '에세이3',
      content: '내용3',
      author: user,
    },
  ];

  describe('saveEssay', () => {
    const essayData = { title: '제목', content: '내용' } as any;

    it('에세이저장: 좌표없이 땅에 묻기 시도', async () => {
      essayData.status = EssayStatus.BURIAL;

      await expect(essayService.saveEssay(req, req.device, essayData)).rejects.toThrow(
        new HttpException(
          '땅에 묻기 기능을 사용하기 위해선 좌표가 필요합니다.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
    it('에세이저장: 모니터링 유저가 발행 시도', async () => {});
  });
});
