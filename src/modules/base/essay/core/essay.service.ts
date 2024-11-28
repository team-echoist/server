import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Essay } from '../../../../entities/essay.entity';
import { Tag } from '../../../../entities/tag.entity';
import { Story } from '../../../../entities/story.entity';
import { User } from '../../../../entities/user.entity';
import { ToolService } from '../../../utils/tool/tool.service';
import { AwsService } from '../../../adapters/aws/core/aws.service';
import { ReviewService } from '../../../extensions/management/review/core/review.service';
import { StoryService } from '../../../extensions/essay/story/core/story.service';
import { UserService } from '../../user/core/user.service';
import { TagService } from '../../../extensions/essay/tag/core/tag.service';
import { FollowService } from '../../../extensions/user/follow/follow.service';
import { BadgeService } from '../../../extensions/essay/badge/core/badge.service';
import { ViewService } from '../../../extensions/essay/view/core/view.service';
import { BookmarkService } from '../../../extensions/essay/bookmark/core/bookmark.service';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { EssayResDto } from '../dto/response/essayRes.dto';
import { UpdateEssayReqDto } from '../dto/request/updateEssayReq.dto';
import { ThumbnailResDto } from '../dto/response/ThumbnailRes.dto';
import { EssayStatsDto } from '../dto/essayStats.dto';
import { SummaryEssayResDto } from '../dto/response/summaryEssayRes.dto';
import { SentenceEssayResDto } from '../dto/response/sentenceEssayRes.dto';
import { WeeklyEssayCountResDto } from '../dto/response/weeklyEssayCountRes.dto';
import { AlertService } from '../../../extensions/management/alert/core/alert.service';
import { DeviceDto } from '../../../extensions/management/support/dto/device.dto';
import { SupportService } from '../../../extensions/management/support/support.service';
import { EssayStatus, PageType, UserStatus } from '../../../../common/types/enum.types';
import { Aggregate } from '../../../../entities/aggregate.entity';
import { Request as ExpressRequest } from 'express';
import { SaveEssayDto } from '../dto/saveEssay.dto';
import { IEssayRepository } from '../infrastructure/iessay.repository';

@Injectable()
export class EssayService {
  constructor(
    @Inject('IEssayRepository') private readonly essayRepository: IEssayRepository,
    private readonly utilsService: ToolService,
    private readonly awsService: AwsService,
    private readonly reviewService: ReviewService,
    private readonly tagService: TagService,
    private readonly storyService: StoryService,
    private readonly followService: FollowService,
    private readonly badgeService: BadgeService,
    private readonly viewService: ViewService,
    private readonly bookmarkService: BookmarkService,
    private readonly alertService: AlertService,
    private readonly supportService: SupportService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async checkEssayPermissions(essay: Essay, userId: number) {
    if (essay.author.id !== userId)
      throw new HttpException('이 에세이에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN);
  }

  @Transactional()
  async saveEssay(requester: Express.User, reqDevice: DeviceDto, data: CreateEssayReqDto) {
    if (data.status === EssayStatus.BURIAL) {
      if (!data.latitude || !data.longitude)
        throw new HttpException(
          '땅에 묻기 기능을 사용하기 위해선 좌표가 필요합니다.',
          HttpStatus.BAD_REQUEST,
        );
    }

    const user = await this.userService.fetchUserEntityById(requester.id);
    const tags = (await this.tagService.getTags(data.tags)) || [];
    let device = await this.supportService.findDevice(user, reqDevice);

    if (!device) {
      device = await this.supportService.newCreateDevice(user, reqDevice);
    }

    const essayData: SaveEssayDto = {
      ...data,
      device,
      author: user,
      tags,
    };

    if (tags.length > 0) void this.badgeService.addExperience(user, tags);

    await this.evaluateUserReputation(user);

    if (requester.status === UserStatus.MONITORED) {
      return await this.handleMonitoredUser(user, essayData, data);
    }

    const savedEssay = await this.essayRepository.saveEssay(essayData);

    return this.utilsService.transformToDto(EssayResDto, savedEssay);
  }

  private async evaluateUserReputation(user: User) {
    const now = new Date();

    const essaysLastWeek = await this.essayRepository.findEssaysLastWeek(user.id, now);

    const essaysLastMonth = await this.essayRepository.findEssaysLastMonth(user.id, now);

    let reputationIncrease = 0;

    if (essaysLastWeek >= 2) {
      reputationIncrease += 5;
    }

    if (essaysLastMonth >= 8) {
      reputationIncrease += 5;
    }

    if (reputationIncrease > 0) {
      await this.userService.increaseReputation(user, reputationIncrease);
    }
  }

  async handleMonitoredUser(user: User, essayData: any, data: CreateEssayReqDto) {
    const adjustedData = {
      ...essayData,
      status: EssayStatus.PRIVATE,
    };

    const savedMonitoredEssay = await this.essayRepository.saveEssay(adjustedData);
    if (data.status !== EssayStatus.PRIVATE) {
      await this.reviewService.saveReviewRequest(user, savedMonitoredEssay, data);
      await this.alertService.createReviewAlerts(savedMonitoredEssay, data.status);
      await this.alertService.sendPushReviewAlert(savedMonitoredEssay);
    }

    return this.utilsService.transformToDto(EssayResDto, savedMonitoredEssay);
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: number, data: UpdateEssayReqDto) {
    const user = await this.userService.fetchUserEntityById(requester.id);

    const essay = await this.essayRepository.findEssayById(essayId);
    await this.checkEssayPermissions(essay, requester.id);
    await this.checkIfEssayUnderReview(essayId, data);

    let message = '';
    if (requester.status === UserStatus.MONITORED && data.status !== EssayStatus.PRIVATE) {
      await this.reviewService.saveReviewRequest(user, essay, data);
      message = '정책 위반으로 인해 요청이 검토됩니다.';
    }

    const story = (await this.storyService.getStoryById(user, data.storyId)) || null;
    const tags = (await this.tagService.getTags(data.tags)) || [];

    await this.updateEssayData(essay, data, story, tags, requester);
    void this.badgeService.addExperience(user, tags);

    const updatedEssay = await this.essayRepository.findEssayById(essayId);
    const resultData = this.utilsService.transformToDto(EssayResDto, updatedEssay);

    return { ...resultData, message: message };
  }

  async checkIfEssayUnderReview(essayId: number, data: UpdateEssayReqDto) {
    const isUnderReview = await this.reviewService.findReviewByEssayId(essayId);
    if (isUnderReview && data.status !== EssayStatus.PRIVATE) {
      throw new HttpException('업데이트 거부: 에세이가 현재 검토중입니다.', HttpStatus.BAD_REQUEST);
    }
  }

  private async updateEssayData(
    essay: Essay,
    data: UpdateEssayReqDto,
    story: Story,
    tags: Tag[],
    requester: Express.User,
  ) {
    const essayData = {
      ...essay,
      ...data,
      story: story,
      tags: tags,
      status: requester.status === UserStatus.MONITORED ? EssayStatus.PRIVATE : data.status,
    };
    return await this.essayRepository.updateEssay(essay, essayData);
  }

  @Transactional()
  async getMyEssays(
    userId: number,
    pageType: PageType,
    page: number,
    limit: number,
    storyId?: number,
  ) {
    let { essays, total } =
      // todo 안드로이드 다음 릴리즈 적용시 해제
      // pageType === PageType.STORY &&
      storyId !== undefined && (await this.storyService.getStoryOwner(userId, storyId))
        ? await this.essayRepository.findStoryEssays(storyId, page, limit, true)
        : await this.essayRepository.findEssays(userId, pageType, page, limit);

    const totalPage: number = Math.ceil(total / limit);

    let currentStoryName: string;
    if (storyId !== undefined)
      currentStoryName = await this.utilsService.findStoryNameInEssays(essays);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    return { essays: essayDtos, total, totalPage, page, currentStoryName };
  }

  async getTargetUserEssays(userId: number, storyId: number, page: number, limit: number) {
    const { essays, total } = await this.essayRepository.findTargetUserEssays(
      userId,
      storyId,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }

  async applyCommonEssayQueryLogic(req: ExpressRequest, essay: Essay) {
    if (!essay) throw new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    const user = await this.userService.fetchUserEntityById(req.user.id);
    const isBookmarked = !!(await this.bookmarkService.getBookmark(user, essay));

    if (essay.author && req.user.id !== essay.author.id) {
      await this.handleNonAuthorView(req.user.id, essay);
    }

    const newEssayData = {
      ...essay,
      author: essay.status === EssayStatus.LINKEDOUT ? undefined : essay.author,
      isBookmarked: isBookmarked,
    };

    return this.utilsService.transformToDto(EssayResDto, newEssayData);
  }

  @Transactional()
  async getEssay(req: ExpressRequest, essayId: number, pageType: PageType, storyId?: number) {
    const essay = await this.essayRepository.findEssayById(essayId);

    let essayDto: EssayResDto | EssayResDto[];
    if (pageType === PageType.BURIAL) {
      essayDto = this.utilsService.transformToDto(EssayResDto, essay);
    } else {
      essayDto = await this.applyCommonEssayQueryLogic(req, essay);
    }

    const anotherEssays =
      pageType === PageType.BURIAL
        ? null
        : pageType === PageType.RECOMMEND
          ? await this.getRecommendEssays(req.user.id, 6)
          : await this.previousEssay(req.user.id, essay, pageType, storyId);

    return { essay: essayDto, anotherEssays: anotherEssays };
  }

  @Transactional()
  async getNextEssay(req: ExpressRequest, essayId: number, pageType: PageType, storyId?: number) {
    const currentEssay = await this.essayRepository.findEssayById(essayId);

    if (!currentEssay) {
      throw new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    let nextEssay: Essay | null = null;

    switch (pageType) {
      case PageType.PUBLIC:
        nextEssay = await this.essayRepository.findNextEssayByPublic(
          currentEssay.author.id,
          currentEssay.id,
        );
        break;
      case PageType.PRIVATE:
        if (currentEssay.author.id !== req.user.id) {
          throw new HttpException(
            '비공개 다음 글은 본인만 조회할 수 있습니다.',
            HttpStatus.BAD_REQUEST,
          );
        }
        nextEssay = await this.essayRepository.findNextEssayByPrivate(req.user.id, currentEssay.id);
        break;
      case PageType.STORY:
        const excludePrivate = currentEssay.author.id !== req.user.id;
        nextEssay = await this.essayRepository.findNextEssayByStory(
          storyId,
          currentEssay.id,
          excludePrivate,
        );
        break;
      default:
        throw new HttpException('잘못된 페이지 타입입니다.', HttpStatus.BAD_REQUEST);
    }

    if (!nextEssay) {
      return null;
    }

    const essayDto = await this.applyCommonEssayQueryLogic(req, nextEssay);

    const anotherEssays = await this.previousEssay(req.user.id, nextEssay, pageType, storyId);

    return { essay: essayDto, anotherEssays: anotherEssays };
  }

  async handleNonAuthorView(userId: number, essay: Essay) {
    const newViews = (essay.views || 0) + 1;

    if (essay.status === EssayStatus.PRIVATE) {
      throw new HttpException('잘못된 요청입니다.', HttpStatus.BAD_REQUEST);
    }

    const viewHistory = await this.viewService.findViewRecord(userId, essay.id);

    if (viewHistory === null) {
      await this.viewService.addViewRecord(
        await this.userService.fetchUserEntityById(userId),
        essay,
      );

      setImmediate(async () => {
        await this.updateEssayAggregateData(essay);

        const cacheKey = `firstViewAlert:${essay.id}`;
        const firstViewAlertSent = await this.redis.get(cacheKey);

        if (!firstViewAlertSent && newViews === 1) {
          await this.redis.set(cacheKey, 'true', 'EX', 200);
          await this.alertFirstView(essay);
        }
      });
    }
  }

  async updateEssayAggregateData(essay: Essay) {
    const lockKey = `lock:aggregate:${essay.id}`;
    const lock = await this.acquireLock(lockKey);

    if (lock) {
      try {
        const newTrendScore = await this.utilsService.calculateTrendScore(essay);
        const aggregate = await this.updateAggregateData(essay, newTrendScore);

        await this.redis.set(`aggregate:${essay.id}`, JSON.stringify(aggregate), 'EX', 300);
      } finally {
        if (lock) {
          await this.redis.del(lockKey);
        }
      }
    } else {
      throw new HttpException(`락 획득 실패: ${essay.id}`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async acquireLock(lockKey: string) {
    const lockTimeout = 100;
    const maxAttempts = 5;
    const baseRetryDelay = 10;
    let lock: string | null = null;
    let attempts = 0;

    while (!lock && attempts < maxAttempts) {
      lock = await this.redis.set(lockKey, 'locked', 'PX', lockTimeout, 'NX');
      if (!lock) {
        attempts++;
        const retryDelay = baseRetryDelay * Math.pow(2, attempts);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    return !!lock;
  }

  async updateAggregateData(essay: Essay, newTrendScore: number): Promise<Aggregate> {
    const viewThreshold = 100;
    const increaseReputation = essay.views > 0 && (essay.views + 1) % viewThreshold === 0;

    let aggregate = await this.findAggregate(essay.id);
    if (aggregate === null) {
      aggregate = new Aggregate();
      aggregate.essayId = essay.id;
      aggregate.userId = essay.author.id;
      aggregate.totalViews = 0;
      aggregate.reputationScore = 0;
      aggregate.trendScore = 0;
    }

    aggregate.totalViews += (aggregate.totalViews ?? 0) + 1;
    aggregate.trendScore = newTrendScore;
    aggregate.reputationScore = increaseReputation
      ? (aggregate.reputationScore ?? 0) + 1
      : (aggregate.reputationScore ?? 0);

    return this.essayRepository.saveAggregate(aggregate);
  }

  private async findAggregate(essayId: number) {
    const cachedAggregate = await this.redis.get(`aggregate:${essayId}`);

    let aggregate = cachedAggregate ? JSON.parse(cachedAggregate) : null;

    if (!aggregate) {
      aggregate = await this.essayRepository.findAggregateById(essayId);
    }

    return aggregate ? aggregate : null;
  }

  async alertFirstView(essay: Essay) {
    await this.alertService.createAlertFirstView(essay);
    await this.alertService.sendPushAlertFirstView(essay);
  }

  async increaseTrendScore(essay: Essay, incrementAmount: number) {
    const newTrendScore = essay.trendScore + incrementAmount;
    await this.essayRepository.updateTrendScore(essay.id, newTrendScore);
  }

  async previousEssay(userId: number, essay: Essay, pageType: PageType, storyId?: number) {
    let previousEssay: Essay[];

    if (pageType === PageType.PUBLIC) {
      previousEssay = await this.essayRepository.findPreviousPublishEssay(
        essay.author.id,
        essay.createdDate,
      );
    } else if (pageType === PageType.PRIVATE) {
      if (userId !== essay.author.id)
        throw new HttpException(
          '비공개 이전 글은 본인만 조회할 수 있습니다.',
          HttpStatus.BAD_REQUEST,
        );
      previousEssay = await this.essayRepository.findPreviousPrivateEssay(
        userId,
        essay.createdDate,
      );
    } else if (pageType === PageType.STORY && storyId !== undefined) {
      previousEssay = await this.essayRepository.findPreviousStoryEssay(
        userId,
        essay.author.id,
        storyId,
        essay.createdDate,
      );
    } else {
      throw new HttpException('잘못된 요청입니다.', HttpStatus.BAD_REQUEST);
    }

    previousEssay.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });

    const essays = this.utilsService.transformToDto(SummaryEssayResDto, previousEssay);
    return { essays: essays };
  }

  @Transactional()
  async deleteEssay(userId: number, essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);

    if (!essay) throw new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    await this.checkEssayPermissions(essay, userId);

    await this.essayRepository.deleteEssay(essay);
  }

  @Transactional()
  async saveThumbnail(file: Express.Multer.File, essayId?: number) {
    const fileName = await this.getFileNameByThumbnail(essayId);
    const newExt = file.originalname.split('.').pop();

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);

    return this.utilsService.transformToDto(ThumbnailResDto, { imageUrl });
  }

  async deleteThumbnail(essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay.thumbnail) {
      throw new HttpException('삭제할 썸네일이 없습니다.', HttpStatus.NOT_FOUND);
    }

    const urlParts = essay.thumbnail.split('/').pop();
    const fileName = `images/${urlParts}`;

    await this.awsService.deleteImageFromS3(fileName);
    essay.thumbnail = null;
    await this.essayRepository.saveEssay(essay);

    return { message: 'Thumbnail deleted successfully' };
  }

  async getFileNameByThumbnail(essayId?: number): Promise<string> {
    const uuid = this.utilsService.getUUID();
    if (!essayId) {
      return `images/${uuid}`;
    }

    const essay = await this.essayRepository.findEssayById(essayId);

    if (essay !== null && essay.thumbnail) {
      const urlParts = essay.thumbnail.split('/').pop();
      return `images/${urlParts}`;
    } else {
      return `images/${uuid}`;
    }
  }

  async getRecommendEssays(userId: number, limit: number) {
    const recentTags = await this.getRecentTags(userId);

    const essays = await this.essayRepository.getRecommendEssays(userId, recentTags);

    const selectedEssays = this.getRandomElements(essays, limit);
    selectedEssays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });

    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, selectedEssays);

    return { essays: essayDtos };
  }

  async getRecentTags(userId: number) {
    const recentEssayIds = await this.viewService.getRecentEssayIds(userId, 5);

    let recentTags: any[];
    if (recentEssayIds.length > 0) {
      const recentTagObjects = await this.essayRepository.getRecentTags(recentEssayIds);
      recentTags = recentTagObjects.map((tag) => tag.tagId);
    }

    return recentTags;
  }

  getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async essayStatsByUserId(userId: number) {
    const essayStats = await this.essayRepository.essayStatsByUserId(userId);
    return this.utilsService.transformToDto(EssayStatsDto, essayStats);
  }

  async getFollowingsEssays(userId: number, page: number, limit: number) {
    const followings = await this.followService.getAllFollowings(userId);
    if (followings.length === 0) return { essays: [] };
    const followingIds = followings
      .filter((follow) => follow.following && follow.following.id)
      .map((follow) => follow.following.id);

    const { essays, total } = await this.essayRepository.getFollowingsEssays(
      followingIds,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }

  async getEssaysByIds(userId: number, essayIds: number[]) {
    return this.essayRepository.findByIds(userId, essayIds);
  }

  async saveEssays(essays: Essay[]) {
    return this.essayRepository.saveEssays(essays);
  }

  async updatedEssaysOfStory(userId: number, story: Story, reqEssayIds: number[]) {
    // 수정할 스토리에 포함된 에세이 아이디 셋
    const essayIdsByStory = new Set(story.essays.map((essay) => essay.id));
    // 요청으로 들어온 에세이 아이디 셋
    const reqEssayIdsSet = new Set(reqEssayIds);

    // 스토리에서 추가되어야 하는 에세이 아이디
    const addedEssayIds = reqEssayIds.filter((essayId) => !essayIdsByStory.has(essayId));
    // 스토리에서 제거되어야 하는 에세이 아이디
    const removedEssayIds = Array.from(essayIdsByStory).filter(
      (essayId) => !reqEssayIdsSet.has(essayId),
    );

    const operations = [];

    if (addedEssayIds.length > 0) {
      operations.push(this.addEssaysStory(userId, addedEssayIds, story));
    }

    if (removedEssayIds.length > 0) {
      operations.push(this.deleteEssaysStory(userId, removedEssayIds));
    }

    await Promise.all(operations);
  }

  async addEssaysStory(userId: number, essayIds: number[], story: Story) {
    const essays = await this.essayRepository.findByIds(userId, essayIds);
    essays.forEach((essay) => {
      essay.story = story;
    });
    await this.essayRepository.saveEssays(essays);
  }

  async deleteEssaysStory(userId: number, essayIds: number[]) {
    const essays = await this.essayRepository.findByIds(userId, essayIds);
    essays.forEach((essay) => {
      essay.story = null;
    });
    await this.essayRepository.saveEssays(essays);
  }

  async getSentenceEssays(userId: number, type: string, limit: number) {
    const recentTags = await this.getRecentTags(userId);

    const essays = await this.essayRepository.getRecommendEssays(userId, recentTags);
    const selectedEssays = this.getRandomElements(essays, limit);

    selectedEssays.forEach((essay) => {
      type === 'first'
        ? (essay.content = this.utilsService.extractFirstSentences(essay.content, 10, 50))
        : (essay.content = this.utilsService.extractEndSentences(essay.content, 10, 50));
    });
    const essayDtos = this.utilsService.transformToDto(SentenceEssayResDto, selectedEssays);

    return { essays: essayDtos };
  }

  async getEssayById(essayId: number) {
    return this.essayRepository.findEssayById(essayId);
  }

  async updateStoryOfEssay(essay: Essay) {
    return this.essayRepository.saveEssay(essay);
  }

  @Transactional()
  async deleteEssayStory(userId: number, essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);

    await this.checkEssayPermissions(essay, userId);

    essay.story = null;
    await this.essayRepository.saveEssay(essay);
  }

  async getEssayToUpdateStory(userId: number, storyId: number, page: number, limit: number) {
    const { essays, total } = await this.essayRepository.findToUpdateStory(
      userId,
      storyId,
      page,
      limit,
    );

    return { essays, total };
  }

  async getRecentViewedEssays(userId: number, page: number, limit: number) {
    const { viewRecords, total } = await this.viewService.findRecentViewedEssays(
      userId,
      page,
      limit,
    );
    const essays = viewRecords.map((viewRecord) => viewRecord.essay);
    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });

    const totalPage: number = Math.ceil(total / limit);

    const essaysDto = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    return { essays: essaysDto, totalPage, page, total };
  }

  async searchEssays(
    pageType: string,
    keyword: string,
    page: number,
    limit: number,
    userId?: number,
  ) {
    if (typeof keyword !== 'string') {
      throw new HttpException('잘못된 키워드 유형', HttpStatus.BAD_REQUEST);
    }
    let cacheKey = `search:${pageType}:${keyword}:${page}:${limit}`;

    if (pageType !== PageType.PRIVATE && pageType !== PageType.ANY) {
      const cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
    }

    const searchKeyword = this.utilsService.preprocessKeyword(keyword);

    let essays: Essay[], total: number;
    switch (pageType) {
      case PageType.PRIVATE:
        ({ essays, total } = await this.essayRepository.searchPrivateEssays(
          userId,
          searchKeyword,
          page,
          limit,
        ));
        break;

      case PageType.ANY:
        ({ essays, total } = await this.essayRepository.searchAllEssays(
          searchKeyword,
          page,
          limit,
        ));
        break;

      default:
        ({ essays, total } = await this.essayRepository.searchPublicEssays(
          searchKeyword,
          page,
          limit,
        ));
        break;
    }

    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.highlightKeywordSnippet(essay.content, keyword);
    });
    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    const result = { essays: essayDtos, total, totalPage, page };
    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  async getWeeklyEssayCounts(userId: number) {
    const now = new Date();
    const fiveWeeksAgo = this.utilsService.getStartOfWeek(new Date(now));
    fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 28);

    const rawData = await this.essayRepository.getWeeklyEssayCounts(userId, fiveWeeksAgo);

    const weeklyEssayCounts = this.utilsService.formatWeeklyData(rawData, fiveWeeksAgo, now);

    return this.utilsService.transformToDto(WeeklyEssayCountResDto, weeklyEssayCounts);
  }

  @Transactional()
  async handleUpdateEssayStatus(userIds: number[]) {
    await this.essayRepository.handleUpdateEssayStatus(userIds);
  }

  async findUpdatedAggregates(offset: number, limit: number) {
    const lastSyncTime = await this.essayRepository.findLastSyncTime();

    return await this.essayRepository.findAggregateByLastTime(
      lastSyncTime ? lastSyncTime.lastSync : new Date(0),
      offset,
      limit,
    );
  }

  @Transactional()
  async getStoryEssays(storyId: number, page: number, limit: number, isOwner: boolean) {
    const { essays, total } = await this.essayRepository.findStoryEssays(
      storyId,
      page,
      limit,
      isOwner,
    );

    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(SummaryEssayResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }
}
