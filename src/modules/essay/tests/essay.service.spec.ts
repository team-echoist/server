import { Test, TestingModule } from '@nestjs/testing';
import { EssayService } from '../essay.service';
import { EssayRepository } from '../essay.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User, UserStatus } from '../../../entities/user.entity';
import { Essay, EssayStatus } from '../../../entities/essay.entity';
import { Story } from '../../../entities/story.entity';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';
import { UtilsModule } from '../../utils/utils.module';
import { AwsService } from '../../aws/aws.service';
import { StoryService } from '../../story/story.service';
import { UserService } from '../../user/user.service';
import { TagService } from '../../tag/tag.service';
import { ReviewService } from '../../review/review.service';
import { FollowService } from '../../follow/follow.service';
import { BadgeService } from '../../badge/badge.service';
import { ViewService } from '../../view/view.service';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { ReportModule } from '../../report/report.module';
import { ReportService } from '../../report/report.service';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

describe('EssayService', () => {
  let essayService: EssayService;
  const mockEssayRepository = {
    saveEssay: jest.fn(),
    findEssayById: jest.fn(),
    findCategoryById: jest.fn(),
    saveReviewRequest: jest.fn(),
    findReviewByEssayId: jest.fn(),
    updateEssay: jest.fn(),
    findEssays: jest.fn(),
    deleteEssay: jest.fn(),
    findEssaysLastMonth: jest.fn(),
    findEssaysLastWeek: jest.fn(),
  };
  const mockUserService = {
    fetchUserEntityById: jest.fn(),
  };

  const mockStoryService = {
    getStoryById: jest.fn(),
  };
  const mockTagService = {
    getTags: jest.fn(),
  };
  const mockReviewService = {
    saveReviewRequest: jest.fn(),
    findReviewByEssayId: jest.fn(),
  };

  const mockUtilsService = {
    transformToDto: jest.fn(),
  };

  const mockFollowService = {};
  const mockBadgeService = {
    addExperience: jest.fn(),
  };
  const mockViewService = {
    addViewRecord: jest.fn(),
  };
  const mockBookmarkService = {};

  const mockReportService = {};

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      imports: [UtilsModule],
      providers: [
        EssayService,
        { provide: EssayRepository, useValue: mockEssayRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: AwsService, useValue: {} },
        { provide: StoryService, useValue: mockStoryService },
        { provide: TagService, useValue: mockTagService },
        { provide: ReviewService, useValue: mockReviewService },
        { provide: FollowService, useValue: mockFollowService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: ViewService, useValue: mockViewService },
        { provide: BookmarkService, useValue: mockBookmarkService },
        { provide: ReportService, useValue: mockReportService },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    essayService = module.get<EssayService>(EssayService);
  });

  describe('saveEssay', () => {
    // it('요청 데이터에 카테고리 아이디가 있지만 찾을 수 없다면', async () => {
    //   const user = { id: 1, monitored: false };
    //   const data = { id: 1, title: 'New Essay', categoryId: 10 };
    //
    //   mockStoryService.getStoryById.mockReturnValue(null);
    //
    //   expect(await essayService.saveEssay(user as any, 'web', data as any)).toEqual({});
    // });

    it('밴 유저의 경우 발행 및 링크드아웃 요청시 리뷰 생성', async () => {
      const user = new User();
      const data = new CreateEssayReqDto();
      const savedMonitoredEssay = new Essay();

      user.id = 1;
      user.status = UserStatus.MONITORED;
      data.title = 'New Essay';
      data.content = 'New Essay content';
      data.status = EssayStatus.PUBLISHED;
      savedMonitoredEssay.id = 1;
      savedMonitoredEssay.status = EssayStatus.PRIVATE;

      mockUserService.fetchUserEntityById.mockResolvedValue(user);
      mockEssayRepository.saveEssay.mockResolvedValue(savedMonitoredEssay);

      const result = await essayService.saveEssay(user, 'web', data);
      expect(mockReviewService.saveReviewRequest).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Your essay is under review due to policy violations.' });
    });

    it('일반 유저는 그냥 저장', async () => {
      const user = new User();
      const data = { id: 1, title: 'New Essay', categoryId: 10, published: true };
      const savedEssay = new Essay();
      const category = new Story();

      user.status = UserStatus.ACTIVE;
      savedEssay.status = EssayStatus.PUBLISHED;
      mockUserService.fetchUserEntityById.mockResolvedValue(user);
      mockEssayRepository.findCategoryById.mockResolvedValue(category);
      mockEssayRepository.saveEssay.mockResolvedValue(savedEssay);

      const result: any = await essayService.saveEssay(user as any, 'web', data as any);

      expect(result.status).toEqual(EssayStatus.PUBLISHED);
    });
  });

  describe('updateEssay', () => {
    it('에세이가 검토 중인 경우 에러 발생', async () => {
      const user = { id: 1, monitored: false };
      const data = { categoryId: 10, linkedOut: true };
      const essay = { id: 1, author: { id: 1 } };
      const reviewQueue = new ReviewQueue();
      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockReviewService.findReviewByEssayId.mockResolvedValue(reviewQueue);

      await expect(essayService.updateEssay(user as any, essay.id, data as any)).rejects.toThrow(
        new HttpException(
          'Update rejected: Essay is currently under review',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('밴 사용자가 발행 또는 링크드아웃으로 수정 요청시', async () => {
      const user = { id: 1, status: UserStatus.MONITORED };
      const data = { categoryId: 10, status: EssayStatus.PUBLISHED };
      const essay = {
        id: 1,
        content: 'Sample content',
        createdDate: new Date(),
        latitude: 37.7749,
        linkedOutGauge: 5,
        location: 'Sample location',
        longitude: -122.4194,
        message: '',
        status: EssayStatus.PRIVATE,
        tags: ['tag1', 'tag2'],
        thumbnail: 'sample-thumbnail.jpg',
        title: 'Sample title',
        updatedDate: new Date(),
        author: { id: 1 },
      };

      const expectedEssay = {
        id: 1,
        status: EssayStatus.PRIVATE,
        title: 'Sample title',
        content: 'Sample content',
      };

      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockUtilsService.transformToDto.mockResolvedValue(expectedEssay);
      mockReviewService.findReviewByEssayId.mockResolvedValue(null);

      const result = await essayService.updateEssay(user as any, essay.id, data as any);

      expect(result).toMatchObject(expectedEssay);
    });
  });

  describe('getMyEssay', () => {
    it('should return essays based on user and filters', async () => {
      const essay = new Essay();
      essay.id = 1;
      essay.title = 'Test Essay';
      essay.content = 'Test Content';
      const mockEssays = [essay];
      const response = { essays: mockEssays, total: 1 };
      mockEssayRepository.findEssays.mockResolvedValue(response);

      const result: any = await essayService.getMyEssays(1, true, 10, 1, 1);

      expect(result.essays.length).toBe(1);
      expect(result.total).toEqual(1);
    });
  });

  describe('deleteEssay', () => {
    it('삭제요청한 에세이가 사용자 소유가 아닌 경우', async () => {
      const user = new User();
      user.id = 2;
      const essay = new Essay();
      essay.id = 1;
      essay.author = user;
      mockEssayRepository.findEssayById.mockResolvedValue(essay);

      await expect(essayService.deleteEssay(1, 1)).rejects.toThrow(
        new HttpException('You do not have permission for this essay.', HttpStatus.FORBIDDEN),
      );
    });

    it('저자가 맞다면 삭제', async () => {
      const user = new User();
      user.id = 1;
      const essay = new Essay();
      essay.id = 1;
      essay.author = user;
      mockEssayRepository.findEssayById.mockResolvedValue(essay);

      await expect(essayService.deleteEssay(1, 1)).resolves.toBeUndefined();
      expect(mockEssayRepository.deleteEssay).toHaveBeenCalledWith(essay);
    });
  });
});
