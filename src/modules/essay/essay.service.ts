import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { ReviewService } from '../review/review.service';
import { StoryService } from '../story/story.service';
import { UserService } from '../user/user.service';
import { TagService } from '../tag/tag.service';
import { FollowService } from '../follow/follow.service';
import { EssayRepository } from './essay.repository';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { Story } from '../../entities/story.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';
import { EssayStatsDto } from './dto/essayStats.dto';
import { EssaysResDto } from './dto/response/essaysRes.dto';
import { SentenceEssaysResDto } from './dto/response/sentenceEssaysRes.dto';
import { BadgeService } from '../badge/badge.service';
import { CreateStoryReqDto } from '../story/dto/repuest/createStoryReq.dto';
import { EssaySummaryResDto } from './dto/response/essaySummaryRes.dto';
import { ViewService } from '../view/view.service';

@Injectable()
export class EssayService {
  constructor(
    private readonly essayRepository: EssayRepository,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
    private readonly reviewService: ReviewService,
    private readonly tagService: TagService,
    private readonly storyService: StoryService,
    private readonly followService: FollowService,
    private readonly badgeService: BadgeService,
    private readonly viewService: ViewService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  private async checkEssayPermissions(essay: Essay, userId: number) {
    if (essay.author.id !== userId)
      throw new HttpException('You do not have permission for this essay.', HttpStatus.FORBIDDEN);
  }

  @Transactional()
  async saveEssay(requester: Express.User, device: string, data: CreateEssayReqDto) {
    const user = await this.userService.fetchUserEntityById(requester.id);
    const tags = await this.tagService.getTags(data.tags);

    const essayData = {
      ...data,
      device: device,
      author: user,
      tags: tags,
    };

    if (requester.status === UserStatus.MONITORED) {
      return await this.handleMonitoredUser(user, essayData, data);
    }

    const savedEssay = await this.essayRepository.saveEssay(essayData);
    void this.badgeService.addExperience(user, tags);

    return this.utilsService.transformToDto(EssayResDto, savedEssay);
  }

  private async handleMonitoredUser(user: User, essayData: any, data: CreateEssayReqDto) {
    const adjustedData = {
      ...essayData,
      status: EssayStatus.PRIVATE,
    };

    const savedMonitoredEssay = await this.essayRepository.saveEssay(adjustedData);
    const essay = await this.essayRepository.findEssayById(savedMonitoredEssay.id);

    const monitoredEssay = this.utilsService.transformToDto(EssayResDto, essay);

    if (data.status !== EssayStatus.PRIVATE) {
      await this.reviewService.saveReviewRequest(user, essay, data);
      return {
        ...monitoredEssay,
        message: 'Your essay is under review due to policy violations.',
      };
    }

    return monitoredEssay;
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: number, data: UpdateEssayReqDto) {
    const user = await this.userService.fetchUserEntityById(requester.id);

    const story = await this.storyService.getStoryById(user, data.storyId);
    const tags = await this.tagService.getTags(data.tags);

    const essay = await this.essayRepository.findEssayById(essayId);
    await this.checkEssayPermissions(essay, requester.id);
    await this.checkIfEssayUnderReview(essayId, data);

    let message = '';
    if (requester.status === UserStatus.MONITORED && data.status !== EssayStatus.PRIVATE) {
      await this.reviewService.saveReviewRequest(user, essay, data);
      message = 'Review request created due to policy violations.';
    }

    await this.updateEssayData(essay, data, story, tags, requester);
    void this.badgeService.addExperience(user, tags);

    const updatedEssay = await this.essayRepository.findEssayById(essayId);
    const resultData = this.utilsService.transformToDto(EssayResDto, updatedEssay);

    return { ...resultData, message: message };
  }

  private async checkIfEssayUnderReview(essayId: number, data: UpdateEssayReqDto) {
    const isUnderReview = await this.reviewService.findReviewByEssayId(essayId);
    if (isUnderReview && data.status !== EssayStatus.PRIVATE) {
      throw new HttpException(
        'Update rejected: Essay is currently under review',
        HttpStatus.BAD_REQUEST,
      );
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
    published: boolean,
    storyId: number,
    page: number,
    limit: number,
  ) {
    const { essays, total } = await this.essayRepository.findEssays(
      userId,
      published,
      storyId,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(EssaysResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
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
    const essayDtos = this.utilsService.transformToDto(EssaysResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }

  @Transactional()
  async getEssay(userId: number, essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);

    if (userId !== essay.author.id) {
      if (essay.status === EssayStatus.PRIVATE) {
        throw new HttpException('This is an invalid request.', HttpStatus.BAD_REQUEST);
      } else {
        const user = await this.userService.fetchUserEntityById(userId);

        await this.essayRepository.incrementViews(essay);
        await this.viewService.addViewRecord(user, essay);
      }
    }

    const previousEssay = await this.previousEssay(essay.author.id, essay);
    const essayDto = this.utilsService.transformToDto(EssayResDto, essay);

    return { essay: essayDto, previousEssays: previousEssay };
  }

  private async previousEssay(userId: number, essay: Essay) {
    let previousEssay: Essay[];

    userId === essay.author.id
      ? (previousEssay = await this.essayRepository.findPreviousMyEssay(userId, essay.createdDate))
      : (previousEssay = await this.essayRepository.findPreviousEssay(userId, essay.createdDate));

    previousEssay.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });

    return this.utilsService.transformToDto(EssaysResDto, previousEssay);
  }

  @Transactional()
  async deleteEssay(userId: number, essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);
    await this.checkEssayPermissions(essay, userId);

    await this.essayRepository.deleteEssay(essay);
  }

  @Transactional()
  async saveThumbnail(file: Express.Multer.File, essayId?: number) {
    const fileName = await this.getFileName(essayId);
    const newExt = file.originalname.split('.').pop();

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);

    return this.utilsService.transformToDto(ThumbnailResDto, { imageUrl });
  }

  async deleteThumbnail(essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay.thumbnail) {
      throw new NotFoundException('No thumbnail to delete');
    }

    const urlParts = essay.thumbnail.split('/');
    const fileName = urlParts[urlParts.length - 1];

    await this.awsService.deleteImageFromS3(fileName);
    essay.thumbnail = null;
    await this.essayRepository.saveEssay(essay);

    return { message: 'Thumbnail deleted successfully' };
  }

  private async getFileName(essayId?: number): Promise<string> {
    if (!essayId) {
      return this.utilsService.getUUID();
    }

    const essay = await this.essayRepository.findEssayById(essayId);
    return essay.thumbnail ? essay.thumbnail.split('/').pop() : this.utilsService.getUUID();
  }

  async getRecommendEssays(limit: number) {
    const essays = await this.essayRepository.getRecommendEssays(limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(EssaysResDto, essays);

    return { essays: essayDtos };
  }

  async essayStatsByUserId(userId: number) {
    const essayStats = await this.essayRepository.essayStatsByUserId(userId);
    return this.utilsService.transformToDto(EssayStatsDto, essayStats);
  }

  async getFollowingsEssays(userId: number, page: number, limit: number) {
    const followings = await this.followService.getAllFollowings(userId);
    const followingIds = followings.map((follow) => follow.following.id);

    if (followingIds.length === 0) {
      return { essays: [] };
    }

    const { essays, total } = await this.essayRepository.getFollowingsEssays(
      followingIds,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(total / limit);

    essays.forEach((essay) => {
      essay.content = this.utilsService.extractPartContent(essay.content);
    });
    const essayDtos = this.utilsService.transformToDto(EssaysResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }

  async getStories(userId: number) {
    const stories = await this.storyService.getStoriesByUserId(userId);
    return { stories: stories };
  }

  @Transactional()
  async saveStory(userId: number, data: CreateStoryReqDto) {
    const savedStory = await this.storyService.saveStory(userId, data.name);

    if (data.essayIds && data.essayIds.length > 0) {
      const essays = await this.essayRepository.findByIds(userId, data.essayIds);
      essays.forEach((essay) => {
        essay.story = savedStory;
      });
      await this.essayRepository.saveEssays(essays);
    }
  }

  @Transactional()
  async updateStory(userId: number, StoryId: number, data: CreateStoryReqDto) {
    let story: Story;
    if (data.name && data.name !== '') {
      story = await this.storyService.updateStory(userId, StoryId, data);
    }

    if (data.essayIds && data.essayIds.length > 0) {
      await this.updatedEssaysOfStory(userId, story, data.essayIds);
    }
  }

  async updatedEssaysOfStory(userId: number, story: Story, reqEssayIds: number[]) {
    const exEssayIds = story.essays.map((essay) => essay.id);

    const addedEssayIds = reqEssayIds.filter((essayId) => !exEssayIds.includes(essayId));
    const removedEssayIds = exEssayIds.filter((essayId) => !reqEssayIds.includes(essayId));

    if (addedEssayIds.length > 0) {
      await this.addEssaysStory(userId, addedEssayIds, story);
    }

    if (removedEssayIds.length > 0) {
      await this.deleteEssaysStory(userId, removedEssayIds);
    }
  }

  private async addEssaysStory(userId: number, essayIds: number[], story: Story) {
    const essays = await this.essayRepository.findByIds(userId, essayIds);
    essays.forEach((essay) => {
      essay.story = story;
    });
    await this.essayRepository.saveEssays(essays);
  }

  private async deleteEssaysStory(userId: number, essayIds: number[]) {
    const essays = await this.essayRepository.findByIds(userId, essayIds);
    essays.forEach((essay) => {
      essay.story = null;
    });
    await this.essayRepository.saveEssays(essays);
  }

  async deleteStory(userId: number, storyId: number) {
    await this.storyService.deleteStory(userId, storyId);
  }

  async getSentenceEssays(type: string, limit: number) {
    const essays = await this.essayRepository.getRecommendEssays(limit);
    essays.forEach((essay) => {
      type === 'first'
        ? (essay.content = this.utilsService.extractFirstSentences(essay.content, 10, 50))
        : (essay.content = this.utilsService.extractEndSentences(essay.content, 10, 50));
    });
    const essayDtos = this.utilsService.transformToDto(SentenceEssaysResDto, essays);

    return { essays: essayDtos };
  }

  async updateEssayStory(userId: number, essayId: number, storyId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const essay = await this.essayRepository.findEssayById(essayId);

    await this.checkEssayPermissions(essay, userId);

    essay.story = await this.storyService.getStoryById(user, storyId);
    await this.essayRepository.saveEssay(essay);
  }

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
    const totalPage: number = Math.ceil(total / limit);

    const transformedEssays = essays.map((essay) => ({
      id: essay.id,
      title: essay.title,
      createdDate: essay.createdDate,
      story: essay.story ? essay.story.id : null,
    }));

    const essaysDto = this.utilsService.transformToDto(EssaySummaryResDto, transformedEssays);

    return { essays: essaysDto, totalPage, page, total };
  }

  async getRecentViewedEssays(userId: number, page: number, limit: number) {
    return await this.viewService.findRecentViewedEssays(userId, page, limit);
  }
}
