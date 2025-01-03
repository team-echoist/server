import { getQueueToken } from '@nestjs/bull';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EssayStatus, PageType, UserStatus } from '../../../../common/types/enum.types';
import { AwsService } from '../../../adapters/aws/core/aws.service';
import { BadgeService } from '../../../extensions/essay/badge/core/badge.service';
import { BookmarkService } from '../../../extensions/essay/bookmark/core/bookmark.service';
import { StoryService } from '../../../extensions/essay/story/core/story.service';
import { TagService } from '../../../extensions/essay/tag/core/tag.service';
import { ViewService } from '../../../extensions/essay/view/core/view.service';
import { AlertService } from '../../../extensions/management/alert/core/alert.service';
import { ReviewService } from '../../../extensions/management/review/core/review.service';
import { SupportService } from '../../../extensions/management/support/core/support.service';
import { FollowService } from '../../../extensions/user/follow/core/follow.service';
import { ToolService } from '../../../utils/tool/core/tool.service';
import { UserService } from '../../user/core/user.service';
import { EssayService } from '../core/essay.service';
import { EssayRepository } from '../infrastructure/essay.repository';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('ioredis');
jest.mock('bull');
jest.mock('../infrastructure/essay.repository');
jest.mock('../../util/util.service');
jest.mock('../../aws/core/aws.service');
jest.mock('../../review/review.service');
jest.mock('../../story/story.service');
jest.mock('../../user/core/user.service');
jest.mock('../../tag/tag.service');
jest.mock('../../follow/follow.service');
jest.mock('../../badge/core/badge.service');
jest.mock('../../view/view.service');
jest.mock('../../bookmark/bookmark.service');
jest.mock('../../alert/core/alert.service');
jest.mock('../../support/support.service');

describe('EssayService', () => {
  let essayService: EssayService;
  let essayRepository: jest.Mocked<EssayRepository>;
  let utilsService: jest.Mocked<ToolService>;
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
  let anotherEssay: any;
  let essays: any;
  let tags: any;
  let req: any;
  let device: any;
  let file: Express.Multer.File;

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssayService,
        { provide: EssayRepository, useClass: EssayRepository },
        { provide: ToolService, useClass: ToolService },
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
    utilsService = module.get(ToolService) as jest.Mocked<ToolService>;
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

    utilsService.transformToDto.mockImplementation((_, any) => any);
    utilsService.extractPartContent.mockImplementation((any) => any);

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

    device = { id: 1, uid: '1234', fcmToken: '1234', os: 'UNKNOWN', model: '', user: user } as any;

    req = { ip: '127.0.0.1', user, device: device } as any;

    essay = {
      id: 1,
      title: '에세이1',
      content: '내용1',
      author: user,
      status: EssayStatus.PUBLIC,
      createdDate: new Date(),
      thumbnail: null,
    } as any;

    anotherEssay = {
      id: 5,
      title: '에세이5',
      content: '내용5',
      author: user,
      status: EssayStatus.PUBLIC,
    } as any;

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
    ] as any;

    tags = [
      {
        id: 1,
        name: 'tag1',
      },
      {
        id: 2,
        name: 'tag2',
      },
    ];

    file = {
      originalname: 'example.jpg',
      buffer: Buffer.from('sample buffer data'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;
  });

  describe('saveEssay', () => {
    const essayData = {
      title: '제목',
      content: '내용',
      status: EssayStatus.PUBLIC,
      tags: null,
    } as any;

    it('에세이저장: 좌표없이 땅에 묻기 시도', async () => {
      essayData.status = EssayStatus.BURIAL;

      await expect(essayService.saveEssay(req, req.device, essayData)).rejects.toThrow(
        new HttpException(
          '땅에 묻기 기능을 사용하기 위해선 좌표가 필요합니다.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('에세이저장: 모니터링 유저 리뷰생성', async () => {
      essayData.status = EssayStatus.PUBLIC;
      user.status = UserStatus.MONITORED;

      userService.fetchUserEntityById.mockResolvedValue(user);
      supportService.findDevice.mockResolvedValue(device);

      jest.spyOn(essayService, 'handleMonitoredUser').mockResolvedValue(essay);

      const result = await essayService.saveEssay(req.user, req.device, essayData);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(req.user.id);
      expect(tagService.getTags).toHaveBeenCalledWith(essayData.tags);
      expect(supportService.findDevice).toHaveBeenCalledWith(user, req.device);
      expect(result).toMatchObject({
        title: '에세이1',
        content: '내용1',
      });
    });

    it('에세이저장: 성공', async () => {
      essayData.status = EssayStatus.PUBLIC;
      user.status = UserStatus.ACTIVATED;

      userService.fetchUserEntityById.mockResolvedValue(user);
      supportService.findDevice.mockResolvedValue(device);
      essayRepository.saveEssay.mockResolvedValue(essay);

      const result = await essayService.saveEssay(req.user, req.device, essayData);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(req.user.id);
      expect(tagService.getTags).toHaveBeenCalledWith(essayData.tags);
      expect(supportService.findDevice).toHaveBeenCalledWith(user, req.device);
      expect(result).toEqual(essay);
    });
  });

  describe('handleMonitoredUser', () => {
    const essayData = {
      title: '제목',
      content: '내용',
      status: EssayStatus.PUBLIC,
    } as any;
    const savedEssay = {
      ...essayData,
      status: EssayStatus.PRIVATE,
    };
    const data = {
      status: EssayStatus.PUBLIC,
    } as any;
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('모니터링유저핸들링: 리뷰요청생성', async () => {
      user.status = UserStatus.MONITORED;

      essayRepository.saveEssay.mockResolvedValue(savedEssay);

      const result = await essayService.handleMonitoredUser(user, essayData, data);

      expect(reviewService.saveReviewRequest).toHaveBeenCalledWith(user, savedEssay, data);
      expect(alertService.createReviewAlerts).toHaveBeenCalledWith(savedEssay, data.status);
      expect(alertService.sendPushReviewAlert).toHaveBeenCalledWith(savedEssay);
      expect(result).toEqual(savedEssay);
    });

    it('모니터링유저핸들링: 리뷰요청미생성', async () => {
      essayData.status = EssayStatus.PRIVATE;
      data.status = EssayStatus.PRIVATE;
      user.status = UserStatus.MONITORED;

      essayRepository.saveEssay.mockResolvedValue(savedEssay);

      const result = await essayService.handleMonitoredUser(user, essayData, data);

      expect(reviewService.saveReviewRequest).not.toHaveBeenCalled();
      expect(alertService.createReviewAlerts).not.toHaveBeenCalled();
      expect(alertService.sendPushReviewAlert).not.toHaveBeenCalled();
      expect(result).toEqual(savedEssay);
    });
  });

  describe('updateEssay', () => {
    const data = {
      title: '제목',
      content: '내용',
      status: EssayStatus.PUBLIC,
    } as any;

    it('에세이업데이트: 모니터링유저', async () => {
      user.status = UserStatus.MONITORED;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayRepository.findEssayById.mockResolvedValue(essay);

      const result = await essayService.updateEssay(req.user, essay.id, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(req.user.id);
      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essay.id);
      expect(reviewService.saveReviewRequest).toHaveBeenCalledWith(user, essay, data);
      expect(result).toMatchObject({ ...essay, message: '정책 위반으로 인해 요청이 검토됩니다.' });
    });
    it('에세이업데이트: 일반유저', async () => {
      user.status = UserStatus.ACTIVATED;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayRepository.findEssayById.mockResolvedValue(essay);

      const result = await essayService.updateEssay(req.user, essay.id, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(req.user.id);
      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essay.id);
      expect(reviewService.saveReviewRequest).not.toHaveBeenCalled();
      expect(result).toMatchObject({ ...essay, message: '' });
    });
  });

  describe('checkIfEssayUnderReview', () => {
    const data = {
      title: '제목',
      content: '내용',
      status: EssayStatus.PUBLIC,
    } as any;
    const review = { id: 1 } as any;

    it('에세이업데이트: 중복검토확인', async () => {
      reviewService.findReviewByEssayId.mockResolvedValue(review);

      await expect(essayService.checkIfEssayUnderReview(essay.id, data)).rejects.toThrow(
        new HttpException('업데이트 거부: 에세이가 현재 검토중입니다.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getMyEssays', () => {
    it('에세이조회: 자신의 에세이리스트', async () => {
      essayRepository.findEssays.mockResolvedValue({ essays, total: 3 });

      const result = await essayService.getMyEssays(user.id, PageType.PRIVATE, 1, 10);

      expect(essayRepository.findEssays).toHaveBeenCalledWith(user.id, PageType.PRIVATE, 1, 10);
      expect(result).toEqual({ essays, total: 3, totalPage: 1, page: 1 });
    });
  });

  describe('getTargetUserEssays', () => {
    it('에세이조회: 타겟유저 에세이리스트', async () => {
      essayRepository.findTargetUserEssays.mockResolvedValue({ essays, total: 3 });

      const result = await essayService.getTargetUserEssays(user.id, null, 1, 10);

      expect(essayRepository.findTargetUserEssays).toHaveBeenCalledWith(user.id, null, 1, 10);
      expect(result).toEqual({ essays, total: 3, totalPage: 1, page: 1 });
    });
  });

  describe('applyCommonEssayQueryLogic', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(essayService, 'handleNonAuthorView').mockResolvedValue();
    });
    it('공통로직: 에세이 찾을 수 없음', async () => {
      await expect(essayService.applyCommonEssayQueryLogic(req, null)).rejects.toThrow(
        new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );
    });
    it('공통로직: 북마크 필드 추가', async () => {
      const bookmark = { id: 1 } as any;
      essay.author.id = 2;

      userService.fetchUserEntityById.mockResolvedValue(user);
      bookmarkService.getBookmark.mockResolvedValue(bookmark);

      const result = await essayService.applyCommonEssayQueryLogic(req, essay);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(req.user.id);
      expect(bookmarkService.getBookmark).toHaveBeenCalledWith(user, essay);
      expect(essayService.handleNonAuthorView).not.toHaveBeenCalled();
      expect(result).toMatchObject(result);
    });
  });

  describe('getEssay', () => {
    beforeEach(() => {
      jest.spyOn(essayService, 'getRecommendEssays').mockResolvedValue({} as any);
      jest.spyOn(essayService, 'previousEssay').mockResolvedValue({} as any);
      jest.spyOn(essayService, 'applyCommonEssayQueryLogic').mockResolvedValue(essay);

      jest.clearAllMocks();
    });

    it('상세조회: BURIAL', async () => {
      essay.status = EssayStatus.BURIAL;
      essayRepository.findEssayById.mockResolvedValue(essay);

      const result = await essayService.getEssay(req, essay.id, PageType.BURIAL, undefined);

      expect(essayService.getRecommendEssays).not.toHaveBeenCalled();
      expect(essayService.previousEssay).not.toHaveBeenCalled();
      expect(essayService.applyCommonEssayQueryLogic).not.toHaveBeenCalled();

      expect(result).toEqual({ essay: essay, anotherEssays: null });
    });

    it('상세조회: REST', async () => {
      essay.status = EssayStatus.LINKEDOUT;
      essayRepository.findEssayById.mockResolvedValue(essay);

      const result = await essayService.getEssay(req, essay.id, PageType.RECOMMEND, undefined);

      expect(essayService.getRecommendEssays).toHaveBeenCalledWith(req.user.id, 6);
      expect(essayService.previousEssay).not.toHaveBeenCalled();
      expect(essayService.applyCommonEssayQueryLogic).toHaveBeenCalledWith(req, essay);

      expect(result).toEqual({ essay: essay, anotherEssays: {} });
    });

    describe('getNextEssay', () => {
      beforeEach(() => {
        jest.spyOn(essayService, 'previousEssay').mockResolvedValue({} as any);
        jest.spyOn(essayService, 'applyCommonEssayQueryLogic').mockResolvedValue(anotherEssay);

        jest.clearAllMocks();
      });

      it('다음에세이조회: 잘못된페이지타입', async () => {
        await expect(
          essayService.getNextEssay(req, essay.id, undefined, undefined),
        ).rejects.toThrow(new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.BAD_REQUEST));
      });

      it('다음에세이조회: PUBLIC', async () => {
        essayRepository.findEssayById.mockResolvedValue(essay);
        essayRepository.findNextEssayByPublic.mockResolvedValue(anotherEssay);

        const result = await essayService.getNextEssay(req, essay.id, PageType.PUBLIC, undefined);

        expect(essayRepository.findNextEssayByPrivate).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByStory).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByPublic).toHaveBeenCalledWith(
          essay.author.id,
          essay.id,
        );
        expect(essayService.applyCommonEssayQueryLogic).toHaveBeenCalledWith(req, anotherEssay);
        expect(result).toMatchObject({ essay: anotherEssay, anotherEssays: {} });
      });

      it('다음에세이조회: PRIVATE', async () => {
        essayRepository.findEssayById.mockResolvedValue(essay);
        essayRepository.findNextEssayByPrivate.mockResolvedValue(anotherEssay);

        const result = await essayService.getNextEssay(req, essay.id, PageType.PRIVATE, undefined);

        expect(essayRepository.findNextEssayByPublic).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByStory).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByPrivate).toHaveBeenCalledWith(req.user.id, essay.id);
        expect(result).toEqual({ essay: anotherEssay, anotherEssays: {} });
      });

      it('다음에세이조회: STORY', async () => {
        essayRepository.findEssayById.mockResolvedValue(essay);
        essayRepository.findNextEssayByStory.mockResolvedValue(anotherEssay);

        const result = await essayService.getNextEssay(req, essay.id, PageType.STORY, 1);

        expect(essayRepository.findNextEssayByPrivate).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByPublic).not.toHaveBeenCalled();
        expect(essayRepository.findNextEssayByStory).toHaveBeenCalledWith(1, essay.id, false);
        expect(result).toEqual({ essay: anotherEssay, anotherEssays: {} });
      });
    });
  });

  describe('handleNonAuthorView', () => {
    const view = { id: 1 } as any;

    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(essayService, 'updateEssayAggregateData').mockResolvedValue();
      jest.spyOn(essayService, 'alertFirstView').mockResolvedValue();
    });

    it('평판및점수핸들링: 비공개에세이', async () => {
      essay.status = EssayStatus.PRIVATE;
      await expect(essayService.handleNonAuthorView(user.id, essay)).rejects.toThrow(
        new HttpException('잘못된 요청입니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('평판및점수핸들링: 최초조회', async () => {
      viewService.findViewRecord.mockReturnValue(null);

      await essayService.handleNonAuthorView(user.id, essay);
      await new Promise((resolve) => setImmediate(resolve));

      expect(viewService.addViewRecord).toHaveBeenCalled();
      expect(essayService.updateEssayAggregateData).toHaveBeenCalledWith(essay);
      expect(redis.get).toHaveBeenCalledWith(`firstViewAlert:${essay.id}`);
      expect(redis.set).toHaveBeenCalledWith(`firstViewAlert:${essay.id}`, 'true', 'EX', 200);
      expect(essayService.alertFirstView).toHaveBeenCalledWith(essay);
    });

    it('평판및점수핸들링: 중복조회', async () => {
      viewService.findViewRecord.mockReturnValue(view);

      expect(viewService.addViewRecord).not.toHaveBeenCalled();
      expect(userService.fetchUserEntityById).not.toHaveBeenCalled();
      expect(essayService.updateEssayAggregateData).not.toHaveBeenCalled();
      expect(essayService.alertFirstView).not.toHaveBeenCalled();
    });
  });

  describe('updateEssayAggregateData', () => {
    let lockKey: any;
    beforeEach(() => {
      lockKey = `lock:aggregate:${essay.id}`;
    });

    it('락 획득', async () => {
      jest.spyOn(essayService, 'acquireLock').mockResolvedValue(true);
      jest.spyOn(utilsService, 'calculateTrendScore').mockResolvedValue(1);
      jest.spyOn(essayService, 'updateAggregateData').mockResolvedValue({ id: 1 } as any);

      await essayService.updateEssayAggregateData(essay);

      expect(essayService.acquireLock).toHaveBeenCalledWith(lockKey);
      expect(utilsService.calculateTrendScore).toHaveBeenCalledWith(essay);
      expect(essayService.updateAggregateData).toHaveBeenCalledWith(essay, 1);
      expect(redis.set).toHaveBeenCalledWith(`aggregate:${essay.id}`, '{"id":1}', 'EX', 300);
      expect(redis.del).toHaveBeenCalledWith(lockKey);
    });

    it('락 획득 실패', async () => {
      jest.spyOn(essayService, 'acquireLock').mockResolvedValue(false);

      await expect(essayService.updateEssayAggregateData(essay)).rejects.toThrow(
        new HttpException(`락 획득 실패: ${essay.id}`, HttpStatus.TOO_MANY_REQUESTS),
      );
    });
  });

  describe('previousEssay', () => {
    it('이전에세이: 퍼블릭페이지', async () => {
      essayRepository.findPreviousPublishEssay.mockResolvedValue(essays);

      await essayService.previousEssay(user.id, essay, PageType.PUBLIC, undefined);

      expect(essayRepository.findPreviousPublishEssay).toHaveBeenCalledWith(
        essay.author.id,
        essay.createdDate,
      );
    });

    it('이전에세이: 비공개페이지 권한없음', async () => {
      await expect(
        essayService.previousEssay(2, essay, PageType.PRIVATE, undefined),
      ).rejects.toThrow(
        new HttpException('비공개 이전 글은 본인만 조회할 수 있습니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('이전에세이: 비공개페이지 ', async () => {
      essayRepository.findPreviousPrivateEssay.mockResolvedValue(essays);

      await essayService.previousEssay(user.id, essay, PageType.PRIVATE, undefined);

      expect(essayRepository.findPreviousPrivateEssay).toHaveBeenCalledWith(
        user.id,
        essay.createdDate,
      );
    });

    it('이전에세이: 스토리페이지', async () => {
      essayRepository.findPreviousStoryEssay.mockResolvedValue(essays);

      await essayService.previousEssay(user.id, essay, PageType.STORY, 1);

      expect(essayRepository.findPreviousStoryEssay).toHaveBeenCalledWith(
        user.id,
        essay.author.id,
        1,
        essay.createdDate,
      );
    });
  });

  describe('deleteEssay', () => {
    it('에세이 삭제 실패', async () => {
      essayRepository.findEssayById.mockResolvedValue(null);

      await expect(essayService.deleteEssay(user.id, essay.id)).rejects.toThrow(
        new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );
    });

    it('에세이 삭제', async () => {
      essayRepository.findEssayById.mockResolvedValue(essay);
      jest.spyOn(essayService, 'checkEssayPermissions').mockResolvedValue();

      await essayService.deleteEssay(user.id, essay.id);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essay.id);
      expect(essayService.checkEssayPermissions).toHaveBeenCalledWith(essay, user.id);
      expect(essayRepository.deleteEssay).toHaveBeenCalledWith(essay);
    });
  });

  describe('saveThumbnail', () => {
    it('썸네일 경로 생성 및 S3 업로드', async () => {
      jest.spyOn(essayService, 'getFileNameByThumbnail').mockResolvedValue('images/uuid');
      jest
        .spyOn(awsService, 'imageUploadToS3')
        .mockResolvedValue('https://s3.amazonaws.com/bucket/images/uuid');

      const result = await essayService.saveThumbnail(file, 1);

      expect(essayService.getFileNameByThumbnail).toHaveBeenCalledWith(1);
      expect(awsService.imageUploadToS3).toHaveBeenCalledWith('images/uuid', file, 'jpg');
      expect(result).toEqual({ imageUrl: 'https://s3.amazonaws.com/bucket/images/uuid' });
    });
  });

  describe('deleteThumbnail', () => {
    it('썸네일 경로 삭제 및 S3 업데이트', async () => {
      essay.thumbnail = 'https://s3.amazonaws.com/bucket/images/uuid';
      essayRepository.findEssayById.mockResolvedValue(essay);
      awsService.deleteImageFromS3.mockResolvedValue();
      essayRepository.saveEssay.mockResolvedValue(essay);

      await essayService.deleteThumbnail(essay.id);

      expect(essayRepository.findEssayById).toHaveBeenCalledWith(essay.id);
      expect(awsService.deleteImageFromS3).toHaveBeenCalledWith('images/uuid');
      expect(essayRepository.saveEssay).toHaveBeenCalledWith(essay);
    });

    it('썸네일 경로 삭제 및 S3 업데이트: 썸네일 찾을 수 없음', async () => {
      essayRepository.findEssayById.mockResolvedValue(essay);

      await expect(essayService.deleteThumbnail(essay.id)).rejects.toThrow(
        new HttpException('삭제할 썸네일이 없습니다.', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getRecommendEssays', () => {
    it('에세이 추천 리스트', async () => {
      jest.spyOn(essayService, 'getRecentTags').mockResolvedValue([]);
      essayRepository.getRecommendEssays.mockResolvedValue(essays);

      const result = await essayService.getRecommendEssays(user.id, 10);

      expect(essayService.getRecentTags).toHaveBeenCalledWith(user.id);
      expect(essayRepository.getRecommendEssays).toHaveBeenCalledWith(user.id, []);
      expect(result).toEqual({ essays: essays });
    });
  });

  describe('getRecentTags', () => {
    it('최근 사용한 태그 조회: 1개 이상', async () => {
      viewService.getRecentEssayIds.mockResolvedValue([1, 2]);
      essayRepository.getRecentTags.mockResolvedValue([{ tagId: 1 }, { tagId: 2 }]);

      const result = await essayService.getRecentTags(user.id);

      expect(viewService.getRecentEssayIds).toHaveBeenCalledWith(user.id, 5);
      expect(essayRepository.getRecentTags).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual([1, 2]);
    });

    it('최근 사용한 태그 조회: 없음', async () => {
      viewService.getRecentEssayIds.mockResolvedValue([]);

      const result = await essayService.getRecentTags(user.id);

      expect(viewService.getRecentEssayIds).toHaveBeenCalledWith(user.id, 5);
      expect(essayRepository.getRecentTags).not.toHaveBeenCalled();
      expect(result).toEqual(undefined);
    });
  });

  describe('getFollowingsEssays', () => {
    it('팔로잉 에세이 조회: 팔로워 없음', async () => {
      followService.getAllFollowings.mockResolvedValue([]);

      const result = await essayService.getFollowingsEssays(user.id, 1, 10);

      expect(essayRepository.getFollowingsEssays).not.toHaveBeenCalled();
      expect(result).toEqual({ essays: [] });
    });

    it('팔로잉 에세이 조회: 팔로워 있음', async () => {
      followService.getAllFollowings.mockResolvedValue([
        { id: 1, follower: { id: 1 }, following: { id: 2 } },
      ] as any);

      essayRepository.getFollowingsEssays.mockResolvedValue({ essays, total: 1 });

      const result = await essayService.getFollowingsEssays(user.id, 1, 10);

      expect(followService.getAllFollowings).toHaveBeenCalledWith(user.id);
      expect(essayRepository.getFollowingsEssays).toHaveBeenCalledWith([2], 1, 10);
      expect(result).toEqual({ essays, total: 1, totalPage: 1, page: 1 });
    });
  });

  describe('getEssaysByIds', () => {
    it('에세이들 조회', async () => {
      essayRepository.findByIds.mockResolvedValue(essays);

      const result = await essayService.getEssaysByIds(user.id, [1, 2]);

      expect(essayRepository.findByIds).toHaveBeenCalledWith(user.id, [1, 2]);
      expect(result).toEqual(essays);
    });
  });

  describe('saveEssays', () => {
    it('에세이들 저장', async () => {
      essayRepository.saveEssays.mockResolvedValue(essays);

      const result = await essayService.saveEssays(essays);

      expect(result).toEqual(essays);
    });
  });

  describe('updatedEssaysOfStory', () => {
    it('스토리 에세이 전체 업데이트', async () => {
      const story = { id: 1, essays: [{ id: 1 }, { id: 2 }, { id: 3 }] } as any;
      const reqEssayIdsSet = [2, 3, 4];

      jest.spyOn(essayService, 'addEssaysStory').mockResolvedValue();
      jest.spyOn(essayService, 'deleteEssaysStory').mockResolvedValue();

      await essayService.updatedEssaysOfStory(user.id, story, reqEssayIdsSet);

      expect(essayService.addEssaysStory).toHaveBeenCalledWith(user.id, [4], story);
      expect(essayService.deleteEssaysStory).toHaveBeenCalledWith(user.id, [1]);
    });
  });

  describe('addEssaysStory', () => {
    it('스토리에 에세이 추가', async () => {
      const story = { id: 1, essays: [{ id: 2 }, { id: 3 }] } as any;
      essayRepository.findByIds.mockResolvedValue(essays);

      await essayService.addEssaysStory(user.id, [1], story);

      expect(essayRepository.saveEssays).toHaveBeenCalledWith(essays);
    });
  });

  describe('deleteEssaysStory', () => {
    it('에세이의 스토리 삭제', async () => {
      essayRepository.findByIds.mockResolvedValue(essays);

      await essayService.deleteEssaysStory(user.id, [1]);

      expect(essayRepository.saveEssays).toHaveBeenCalledWith(essays);
    });
  });

  describe('getSentenceEssays', () => {
    it('첫 문장 가져오기', async () => {
      jest.spyOn(essayService, 'getRecentTags').mockResolvedValue([]);
      essayRepository.getRecommendEssays.mockResolvedValue(essays);

      // utilsService.extractFirstSentences.mockResolvedValue();
    });
    it('마지막 문장 가져오기', async () => {});
  });
});
