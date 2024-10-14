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
  let service: EssayService;
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

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssayService,
        EssayRepository,
        UtilsService,
        AwsService,
        ReviewService,
        StoryService,
        UserService,
        TagService,
        FollowService,
        BadgeService,
        ViewService,
        BookmarkService,
        AlertService,
        SupportService,
        {
          provide: SupportRepository,
          useValue: { findDevice: jest.fn() },
        },
        {
          provide: getQueueToken('bookmark'),
          useValue: { add: jest.fn() },
        },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    service = module.get<EssayService>(EssayService);
    essayRepository = module.get(EssayRepository);
    utilsService = module.get(UtilsService);
    awsService = module.get(AwsService);
    reviewService = module.get(ReviewService);
    storyService = module.get(StoryService);
    userService = module.get(UserService);
    tagService = module.get(TagService);
    followService = module.get(FollowService);
    badgeService = module.get(BadgeService);
    viewService = module.get(ViewService);
    bookmarkService = module.get(BookmarkService);
    alertService = module.get(AlertService);
    supportService = module.get(SupportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEssayById', () => {
    it('should return an essay by id', async () => {
      const essayId = 1;
      const essay = { id: essayId } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      const result = await service.getEssayById(essayId);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(result).toBe(essay);
    });
  });

  describe('deleteEssay', () => {
    it('should delete an essay by id', async () => {
      const userId = 1;
      const essayId = 1;
      const essay = { id: essayId, author: { id: userId } } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      await service.deleteEssay(userId, essayId);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(essayRepository.deleteEssay).toHaveBeenCalledWith(essay);
    });

    it('should throw an error if user does not have permission', async () => {
      const userId = 1;
      const essayId = 1;
      const essay = { id: essayId, author: { id: 2 } } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      await expect(service.deleteEssay(userId, essayId)).rejects.toThrow(
        new HttpException('이 에세이에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN),
      );
    });
  });

  describe('saveEssay', () => {
    it('should save a new essay', async () => {
      const requester = { id: 1, status: UserStatus.ACTIVATED } as Express.User;
      const device = 'web' as any;
      const data = { title: 'test', content: 'test content', tags: [1] } as any;
      const user = { id: requester.id } as User;
      const tags = [{ id: 1 }] as any[];
      const savedEssay = { id: 1 } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      tagService.getTags.mockResolvedValue(tags);
      essayRepository.saveEssay.mockResolvedValue(savedEssay);
      utilsService.transformToDto.mockReturnValue(savedEssay);
      supportService.findDevice.mockReturnValue(device);

      const result = await service.saveEssay(requester, device, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(requester.id);
      expect(tagService.getTags).toHaveBeenCalledWith(data.tags);
      expect(essayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          device,
          author: user,
          tags,
        }),
      );
      expect(utilsService.transformToDto).toHaveBeenCalledWith(EssayResDto, savedEssay);
      expect(result).toBe(savedEssay);
    });

    it('should handle monitored user', async () => {
      const requester = { id: 1, status: UserStatus.MONITORED } as Express.User;
      const device = 'web' as any;
      const data = {
        title: 'test',
        content: 'test content',
        tags: [1],
        status: EssayStatus.PUBLISHED,
      } as any;
      const user = { id: requester.id } as User;
      const tags = [{ id: 1 }] as any[];
      const savedMonitoredEssay = { id: 1, status: EssayStatus.PRIVATE } as Essay;
      const finalSavedEssay = { id: 1, status: EssayStatus.PUBLISHED } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      tagService.getTags.mockResolvedValue(tags);
      essayRepository.saveEssay.mockResolvedValueOnce(savedMonitoredEssay);
      essayRepository.findEssayById.mockResolvedValueOnce(finalSavedEssay);
      reviewService.saveReviewRequest.mockResolvedValue(undefined);
      alertService.createReviewAlerts.mockResolvedValue(undefined);
      alertService.sendPushReviewAlert.mockResolvedValue(undefined);
      utilsService.transformToDto.mockReturnValue(finalSavedEssay);
      supportService.findDevice.mockReturnValue(device);

      const result = await service.saveEssay(requester, device, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(requester.id);
      expect(tagService.getTags).toHaveBeenCalledWith(data.tags);
      expect(essayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          device,
          author: user,
          tags,
          status: EssayStatus.PRIVATE,
        }),
      );
      expect(reviewService.saveReviewRequest).toHaveBeenCalledWith(user, savedMonitoredEssay, data);
      expect(alertService.createReviewAlerts).toHaveBeenCalledWith(finalSavedEssay, data.status);
      expect(alertService.sendPushReviewAlert).toHaveBeenCalledWith(finalSavedEssay);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(EssayResDto, finalSavedEssay);
      expect(result).toBe(finalSavedEssay);
    });
  });

  describe('updateEssay', () => {
    it('should update an essay', async () => {
      const requester = { id: 1, status: UserStatus.ACTIVATED } as Express.User;
      const essayId = 1;
      const data = {
        title: 'updated title',
        content: 'updated content',
        tags: [1],
        storyId: 1,
        status: EssayStatus.PUBLISHED,
      } as any;
      const user = { id: requester.id } as User;
      const story = { id: 1 } as any;
      const tags = [{ id: 1 }] as any[];
      const essay = { id: essayId, author: user } as Essay;
      const updatedEssay = {
        id: essayId,
        title: 'updated title',
        content: 'updated content',
        author: user,
        story: story,
        tags: tags,
        status: data.status,
      } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      storyService.getStoryById.mockResolvedValue(story);
      tagService.getTags.mockResolvedValue(tags);
      essayRepository.findEssayById.mockResolvedValue(essay);
      reviewService.findReviewByEssayId.mockResolvedValue(null);
      essayRepository.updateEssay.mockResolvedValue(updatedEssay);
      utilsService.transformToDto.mockReturnValue({
        id: updatedEssay.id,
        content: updatedEssay.content,
        author: { id: user.id },
      });

      const result = await service.updateEssay(requester, essayId, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(requester.id);
      expect(storyService.getStoryById).toHaveBeenCalledWith(user, data.storyId);
      expect(tagService.getTags).toHaveBeenCalledWith(data.tags);
      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(reviewService.findReviewByEssayId).toHaveBeenCalledWith(essayId);
      expect(essayRepository.updateEssay).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...data,
          story,
          tags,
          status: data.status,
        }),
      );
      // expect(utilsService.transformToDto).toHaveBeenCalledWith(EssayResDto, updatedEssay);
      expect(result).toEqual(
        expect.objectContaining({
          id: updatedEssay.id,
          content: updatedEssay.content,
          author: { id: user.id },
        }),
      );
    });

    it('should throw an error if essay is under review', async () => {
      const requester = { id: 1, status: UserStatus.ACTIVATED } as Express.User;
      const essayId = 1;
      const data = {
        title: 'updated title',
        content: 'updated content',
        tags: [1],
        storyId: 1,
        status: EssayStatus.PUBLISHED,
      } as any;
      const user = { id: requester.id } as User;
      const essay = { id: essayId, author: user } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayRepository.findEssayById.mockResolvedValue(essay);
      reviewService.findReviewByEssayId.mockResolvedValue({ id: 1 } as any);

      await expect(service.updateEssay(requester, essayId, data)).rejects.toThrow(
        new HttpException('업데이트 거부: 에세이가 현재 검토중입니다.', HttpStatus.BAD_REQUEST),
      );

      expect(reviewService.findReviewByEssayId).toHaveBeenCalledWith(essayId);
    });
  });

  describe('getMyEssays', () => {
    it('should return my essays', async () => {
      const userId = 1;
      const storyId = 1;
      const page = 1;
      const limit = 10;
      const essays = [{ id: 1, content: 'content' }] as Essay[];
      const total = 1;

      essayRepository.findEssays.mockResolvedValue({ essays, total });
      utilsService.extractPartContent.mockImplementation((content) => `part of ${content}`);
      utilsService.transformToDto.mockReturnValue(essays);

      const result = await service.getMyEssays(userId, PageType.PUBLIC, storyId, page, limit);

      expect(essayRepository.findEssays).toHaveBeenCalledWith(
        userId,
        PageType.PUBLIC,
        storyId,
        page,
        limit,
      );
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, essays);
      expect(result).toEqual({
        essays,
        total,
        totalPage: Math.ceil(total / limit),
        page,
      });
    });
  });

  describe('getTargetUserEssays', () => {
    it('should return target user essays', async () => {
      const userId = 1;
      const storyId = 1;
      const page = 1;
      const limit = 10;
      const essays = [{ id: 1, content: 'content' }] as Essay[];
      const total = 1;

      essayRepository.findTargetUserEssays.mockResolvedValue({ essays, total });
      utilsService.extractPartContent.mockImplementation((content) => `part of ${content}`);
      utilsService.transformToDto.mockReturnValue(essays);

      const result = await service.getTargetUserEssays(userId, storyId, page, limit);

      expect(essayRepository.findTargetUserEssays).toHaveBeenCalledWith(
        userId,
        storyId,
        page,
        limit,
      );
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, essays);
      expect(result).toEqual({
        essays,
        total,
        totalPage: Math.ceil(total / limit),
        page,
      });
    });
  });

  describe('getEssay', () => {
    it('should return an essay by id with bookmark status', async () => {
      const userId = 1;
      const essayId = 1;
      const essay = { id: essayId, author: { id: 2 }, views: 0, trendScore: 0 } as Essay;
      const user = { id: userId } as User;
      const previousEssays = [{ id: 2, content: 'previous content' }] as Essay[];

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayRepository.findEssayById.mockResolvedValue(essay);
      bookmarkService.getBookmark.mockResolvedValue(null);
      utilsService.transformToDto.mockReturnValue({
        id: essay.id,
        author: essay.author,
        views: essay.views,
        trendScore: essay.trendScore,
      });
      service.getRecommendEssays = jest.fn().mockResolvedValue({ essays: previousEssays });

      // const result = await service.getEssay(userId, essayId, PageType.RECOMMEND);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(bookmarkService.getBookmark).toHaveBeenCalledWith(user, essay);
      expect(service.getRecommendEssays).toHaveBeenCalledWith(userId, 6);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(
        EssayResDto,
        expect.objectContaining({
          ...essay,
          isBookmarked: false,
        }),
      );
    });

    it('should throw an error if essay is not found', async () => {
      const userId = 1;
      const essayId = 1;

      essayRepository.findEssayById.mockResolvedValue(null);

      // await expect(service.getEssay(userId, essayId, PageType.RECOMMEND)).rejects.toThrow(
      //   new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      // );

      // expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
    });
  });

  describe('deleteEssayStory', () => {
    it('should delete essay story', async () => {
      const userId = 1;
      const essayId = 1;
      const essay = { id: essayId, author: { id: userId }, story: {} } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      await service.deleteEssayStory(userId, essayId);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(essayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          ...essay,
          story: null,
        }),
      );
    });

    it('should throw an error if user does not have permission', async () => {
      const userId = 1;
      const essayId = 1;
      const essay = { id: essayId, author: { id: 2 } } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      await expect(service.deleteEssayStory(userId, essayId)).rejects.toThrow(
        new HttpException('이 에세이에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN),
      );

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
    });
  });

  describe('getRecentViewedEssays', () => {
    it('should return recently viewed essays', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const viewRecords = [{ essay: { id: 1, content: 'content' } }] as any[];
      const essays = viewRecords.map((record) => record.essay);
      const total = viewRecords.length;

      viewService.findRecentViewedEssays.mockResolvedValue({ viewRecords, total });
      utilsService.extractPartContent.mockImplementation((content) => `part of ${content}`);
      utilsService.transformToDto.mockReturnValue(essays);

      const result = await service.getRecentViewedEssays(userId, page, limit);

      expect(viewService.findRecentViewedEssays).toHaveBeenCalledWith(userId, page, limit);
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, essays);
      expect(result).toEqual({
        essays,
        totalPage: Math.ceil(total / limit),
        page,
        total,
      });
    });
  });

  describe('searchEssays', () => {
    it('should return search results from cache if available', async () => {
      const keyword = 'test';
      const page = 1;
      const limit = 10;
      const cachedResult = { essays: [], total: 0, totalPage: 1, page };

      redis.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.searchEssays(keyword, page, limit);

      expect(redis.get).toHaveBeenCalledWith(`search:${keyword}:${page}:${limit}`);
      expect(result).toEqual(cachedResult);
    });

    it('should return search results from database and cache them if not in cache', async () => {
      const keyword = 'test';
      const page = 1;
      const limit = 10;
      const essays = [{ id: 1, content: 'content' }] as Essay[];
      const total = essays.length;
      const searchKeyword = 'processed test';
      const result = { essays, total, totalPage: 1, page };

      redis.get.mockResolvedValue(null);
      utilsService.preprocessKeyword.mockReturnValue(searchKeyword);
      essayRepository.searchEssays.mockResolvedValue({ essays, total });
      utilsService.highlightKeywordSnippet.mockImplementation(
        (content) => `highlighted ${content}`,
      );
      utilsService.transformToDto.mockReturnValue(essays);

      const output = await service.searchEssays(keyword, page, limit);

      expect(redis.get).toHaveBeenCalledWith(`search:${keyword}:${page}:${limit}`);
      expect(utilsService.preprocessKeyword).toHaveBeenCalledWith(keyword);
      expect(essayRepository.searchEssays).toHaveBeenCalledWith(searchKeyword, page, limit);
      expect(utilsService.highlightKeywordSnippet).toHaveBeenCalledWith('content', keyword);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, essays);
      expect(redis.setex).toHaveBeenCalledWith(
        `search:${keyword}:${page}:${limit}`,
        3600,
        JSON.stringify(result),
      );
      expect(output).toEqual(result);
    });
  });

  describe('getWeeklyEssayCounts', () => {
    it('should return weekly essay counts', async () => {
      const userId = 1;
      const now = new Date();
      const fiveWeeksAgo = new Date(now);
      fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 28);
      const rawData = [];
      const weeklyEssayCounts = [];

      utilsService.getStartOfWeek.mockReturnValue(fiveWeeksAgo);
      essayRepository.getWeeklyEssayCounts.mockResolvedValue(rawData);
      utilsService.formatWeeklyData.mockReturnValue(weeklyEssayCounts);
      utilsService.transformToDto.mockReturnValue(weeklyEssayCounts);

      const result = await service.getWeeklyEssayCounts(userId);

      expect(utilsService.getStartOfWeek).toHaveBeenCalledWith(expect.any(Date));
      expect(essayRepository.getWeeklyEssayCounts).toHaveBeenCalledWith(userId, fiveWeeksAgo);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(
        WeeklyEssayCountResDto,
        weeklyEssayCounts,
      );
      expect(result).toEqual(weeklyEssayCounts);
    });
  });

  describe('increaseTrendScore', () => {
    it('should increase trend score of an essay', async () => {
      const essayId = 1;
      const essay = { id: essayId, trendScore: 0 } as Essay;
      const incrementAmount = 5;

      essayRepository.updateTrendScore.mockResolvedValue(undefined);

      await service.increaseTrendScore(essay, incrementAmount);

      expect(essayRepository.updateTrendScore).toHaveBeenCalledWith(essayId, 5);
    });
  });

  describe('getFollowingsEssays', () => {
    it('should return essays from followings', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const followings = [{ following: { id: 2 } }] as any[];
      const followingIds = followings.map((f) => f.following.id);
      const essays = [{ id: 1, content: 'content' }] as Essay[];
      const total = 1;

      followService.getAllFollowings.mockResolvedValue(followings);
      essayRepository.getFollowingsEssays.mockResolvedValue({ essays, total });
      utilsService.extractPartContent.mockImplementation((content) => `part of ${content}`);
      utilsService.transformToDto.mockReturnValue(essays);

      const result = await service.getFollowingsEssays(userId, page, limit);

      expect(followService.getAllFollowings).toHaveBeenCalledWith(userId);
      expect(essayRepository.getFollowingsEssays).toHaveBeenCalledWith(followingIds, page, limit);
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, essays);
      expect(result).toEqual({
        essays,
        total,
        totalPage: Math.ceil(total / limit),
        page,
      });
    });
  });

  describe('saveThumbnail', () => {
    it('should save a thumbnail', async () => {
      const file = { originalname: 'test.png' } as Express.Multer.File;
      const essayId = 1;
      const fileName = 'images/test';
      const imageUrl = 'http://example.com/test.png';
      const essay = { id: essayId, thumbnail: null } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);
      utilsService.getUUID.mockReturnValue('test');
      awsService.imageUploadToS3.mockResolvedValue(imageUrl);
      utilsService.transformToDto.mockReturnValue({ imageUrl });

      const result = await service.saveThumbnail(file, essayId);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(utilsService.getUUID).toHaveBeenCalled();
      expect(awsService.imageUploadToS3).toHaveBeenCalledWith(fileName, file, 'png');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(ThumbnailResDto, { imageUrl });
      expect(result).toEqual({ imageUrl });
    });
  });

  describe('deleteThumbnail', () => {
    it('should delete a thumbnail', async () => {
      const essayId = 1;
      const essay = { id: essayId, thumbnail: 'http://example.com/test.png' } as Essay;
      const fileName = 'images/test.png';

      essayRepository.findEssayById.mockResolvedValue(essay);
      awsService.deleteImageFromS3.mockResolvedValue(undefined);
      essayRepository.saveEssay.mockResolvedValue(essay);

      const result = await service.deleteThumbnail(essayId);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(awsService.deleteImageFromS3).toHaveBeenCalledWith(fileName);
      expect(essayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          ...essay,
          thumbnail: null,
        }),
      );
      expect(result).toEqual({ message: 'Thumbnail deleted successfully' });
    });

    it('should throw an error if no thumbnail to delete', async () => {
      const essayId = 1;
      const essay = { id: essayId, thumbnail: null } as Essay;

      essayRepository.findEssayById.mockResolvedValue(essay);

      await expect(service.deleteThumbnail(essayId)).rejects.toThrow(
        new NotFoundException('No thumbnail to delete'),
      );

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essayId);
    });
  });

  describe('getRecommendEssays', () => {
    it('should return recommended essays', async () => {
      const userId = 1;
      const limit = 10;
      const recentTags = [1, 2];
      const essays = [{ id: 1, content: 'content' }] as Essay[];
      const selectedEssays = essays;

      service.getRecentTags = jest.fn().mockResolvedValue(recentTags);
      essayRepository.getRecommendEssays.mockResolvedValue(essays);
      utilsService.extractPartContent.mockImplementation((content) => `part of ${content}`);
      utilsService.transformToDto.mockReturnValue(selectedEssays);

      const result = await service.getRecommendEssays(userId, limit);

      expect(service.getRecentTags).toHaveBeenCalledWith(userId);
      expect(essayRepository.getRecommendEssays).toHaveBeenCalledWith(userId, recentTags);
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, selectedEssays);
      expect(result).toEqual({ essays: selectedEssays });
    });
  });

  describe('getRecentTags', () => {
    it('should return recent tags', async () => {
      const userId = 1;
      const recentEssayIds = [1, 2, 3];
      const recentTagObjects = [{ tagId: 1 }, { tagId: 2 }];
      const recentTags = [1, 2];

      viewService.getRecentEssayIds.mockResolvedValue(recentEssayIds);
      essayRepository.getRecentTags.mockResolvedValue(recentTagObjects);

      const result = await service.getRecentTags(userId);

      expect(viewService.getRecentEssayIds).toHaveBeenCalledWith(userId, 5);
      expect(essayRepository.getRecentTags).toHaveBeenCalledWith(recentEssayIds);
      expect(result).toEqual(recentTags);
    });

    it('should return empty array if no recent essay ids', async () => {
      const userId = 1;
      const recentEssayIds = [];

      viewService.getRecentEssayIds.mockResolvedValue(recentEssayIds);

      const result = await service.getRecentTags(userId);

      expect(viewService.getRecentEssayIds).toHaveBeenCalledWith(userId, 5);
      expect(result).toEqual(undefined);
    });
  });

  describe('essayStatsByUserId', () => {
    it('should return essay stats by user id', async () => {
      const userId = 1;
      const essayStats = { totalEssays: 10 } as any;

      essayRepository.essayStatsByUserId.mockResolvedValue(essayStats);
      utilsService.transformToDto.mockReturnValue(essayStats);

      const result = await service.essayStatsByUserId(userId);

      expect(essayRepository.essayStatsByUserId).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(EssayStatsDto, essayStats);
      expect(result).toEqual(essayStats);
    });
  });

  describe('getEssaysByIds', () => {
    it('should return essays by ids', async () => {
      const userId = 1;
      const essayIds = [1, 2];
      const essays = [{ id: 1 }, { id: 2 }] as Essay[];

      essayRepository.findByIds.mockResolvedValue(essays);

      const result = await service.getEssaysByIds(userId, essayIds);

      expect(essayRepository.findByIds).toHaveBeenCalledWith(userId, essayIds);
      expect(result).toEqual(essays);
    });
  });

  describe('saveEssays', () => {
    it('should save multiple essays', async () => {
      const essays = [{ id: 1 }, { id: 2 }] as Essay[];

      essayRepository.saveEssays.mockResolvedValue(essays);

      const result = await service.saveEssays(essays);

      expect(essayRepository.saveEssays).toHaveBeenCalledWith(essays);
      expect(result).toEqual(essays);
    });
  });

  describe('updatedEssaysOfStory', () => {
    it('should update essays of a story', async () => {
      const userId = 1;
      const story = { id: 1, essays: [{ id: 2 }] } as Story;
      const reqEssayIds = [1, 3];

      service.addEssaysStory = jest.fn().mockResolvedValue(undefined);
      service.deleteEssaysStory = jest.fn().mockResolvedValue(undefined);

      await service.updatedEssaysOfStory(userId, story, reqEssayIds);

      expect(service.addEssaysStory).toHaveBeenCalledWith(userId, [1, 3], story);
      expect(service.deleteEssaysStory).toHaveBeenCalledWith(userId, [2]);
    });
  });

  describe('addEssaysStory', () => {
    it('should add essays to a story', async () => {
      const userId = 1;
      const story = { id: 1 } as Story;
      const essayIds = [1, 2];
      const essays = essayIds.map((id) => ({ id, story: null })) as Essay[];

      essayRepository.findByIds.mockResolvedValue(essays);
      essayRepository.saveEssays.mockResolvedValue(essays);

      await service.addEssaysStory(userId, essayIds, story);

      essays.forEach((essay) => {
        expect(essay.story).toBe(story);
      });
      expect(essayRepository.findByIds).toHaveBeenCalledWith(userId, essayIds);
      expect(essayRepository.saveEssays).toHaveBeenCalledWith(essays);
    });
  });

  describe('deleteEssaysStory', () => {
    it('should remove essays from a story', async () => {
      const userId = 1;
      const essayIds = [1, 2];
      const essays = essayIds.map((id) => ({ id, story: { id: 1 } })) as Essay[];

      essayRepository.findByIds.mockResolvedValue(essays);
      essayRepository.saveEssays.mockResolvedValue(essays);

      await service.deleteEssaysStory(userId, essayIds);

      essays.forEach((essay) => {
        expect(essay.story).toBeNull();
      });
      expect(essayRepository.findByIds).toHaveBeenCalledWith(userId, essayIds);
      expect(essayRepository.saveEssays).toHaveBeenCalledWith(essays);
    });
  });

  describe('getEssayToUpdateStory', () => {
    it('should return essays to update story', async () => {
      const userId = 1;
      const storyId = 1;
      const page = 1;
      const limit = 10;
      const essays = [{ id: 1 }] as Essay[];
      const total = 1;

      essayRepository.findToUpdateStory.mockResolvedValue({ essays, total });

      const result = await service.getEssayToUpdateStory(userId, storyId, page, limit);

      expect(essayRepository.findToUpdateStory).toHaveBeenCalledWith(userId, storyId, page, limit);
      expect(result).toEqual({ essays, total });
    });
  });

  describe('handleUpdateEssayStatus', () => {
    it('should handle update essay status for multiple users', async () => {
      const userIds = [1, 2];

      essayRepository.handleUpdateEssayStatus.mockResolvedValue(undefined);

      await service.handleUpdateEssayStatus(userIds);

      expect(essayRepository.handleUpdateEssayStatus).toHaveBeenCalledWith(userIds);
    });
  });
});
