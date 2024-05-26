import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { ReviewService } from '../review/review.service';
import { CategoryService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { TagService } from '../tag/tag.service';
import { FollowService } from '../follow/follow.service';
import { EssayRepository } from './essay.repository';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { Category } from '../../entities/category.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';
import { PublicEssaysDto } from './dto/publicEssays.dto';
import { EssayStatsDto } from './dto/essayStats.dto';

@Injectable()
export class EssayService {
  constructor(
    private readonly essayRepository: EssayRepository,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
    private readonly reviewService: ReviewService,
    private readonly tagService: TagService,
    private readonly categoryService: CategoryService,
    private readonly followService: FollowService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  @Transactional()
  async saveEssay(requester: Express.User, device: string, data: CreateEssayReqDto) {
    const user = await this.userService.fetchUserEntityById(requester.id);

    const category = await this.categoryService.getCategoryById(user, data.categoryId);
    const tags = await this.tagService.getTags(data.tags);

    const essayData = {
      ...data,
      device: device,
      author: user,
      category: category,
      tags: tags,
    };

    if (requester.status === UserStatus.MONITORED) {
      return await this.handleMonitoredUser(user, essayData, data);
    }

    const savedEssay = await this.essayRepository.saveEssay(essayData);

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

    const category = await this.categoryService.getCategoryById(user, data.categoryId);
    const tags = await this.tagService.getTags(data.tags);

    const essay = await this.essayRepository.findEssayById(essayId);
    await this.checkIfEssayUnderReview(essayId, data);

    let message = '';
    if (requester.status === UserStatus.MONITORED && data.status !== EssayStatus.PRIVATE) {
      await this.reviewService.saveReviewRequest(user, essay, data);
      message = 'Review request created due to policy violations.';
    }

    await this.updateEssayData(essay, data, category, tags, requester);
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
    category: Category,
    tags: Tag[],
    requester: Express.User,
  ) {
    const essayData = {
      ...essay,
      ...data,
      category: category,
      tags: tags,
      status: requester.status === UserStatus.MONITORED ? EssayStatus.PRIVATE : data.status,
    };
    return await this.essayRepository.updateEssay(essay, essayData);
  }

  @Transactional()
  async getMyEssay(userId: number, published: boolean, categoryId: number, limit: number) {
    const { essays, total } = await this.essayRepository.findEssays(
      userId,
      published,
      categoryId,
      limit,
    );

    const essayDtos = this.utilsService.transformToDto(EssayResDto, essays);

    return { essays: essayDtos, total };
  }

  async deleteEssay(userId: number, essayId: number) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (essay.author.id !== userId)
      throw new HttpException(
        'Essay not found or you do not have permission to delete this essay.',
        HttpStatus.BAD_REQUEST,
      );

    await this.essayRepository.deleteEssay(essay);
    return;
  }

  async saveThumbnailImage(file: Express.Multer.File, essayId?: number) {
    const fileName = await this.getFileName(essayId);
    const newExt = file.originalname.split('.').pop();

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);

    return this.utilsService.transformToDto(ThumbnailResDto, imageUrl);
  }

  private async getFileName(essayId?: number): Promise<string> {
    if (!essayId) {
      return this.utilsService.getUUID();
    }

    const essay = await this.essayRepository.findEssayById(essayId);
    return essay?.thumbnail ? essay.thumbnail.split('/').pop() : this.utilsService.getUUID();
  }

  async getRecommendEssays(limit: number) {
    const essays = await this.essayRepository.getRecommendEssays(limit);
    const essaysDto = this.utilsService.transformToDto(PublicEssaysDto, essays);
    return { essays: essaysDto };
  }

  async essayStatsByUserId(userId: number) {
    const essayStats = await this.essayRepository.essayStatsByUserId(userId);
    return this.utilsService.transformToDto(EssayStatsDto, essayStats);
  }

  async getFollowingsEssays(userId: number, limit: number) {
    const followings = await this.followService.getFollowings(userId);
    const followingIds = followings.map((follow) => follow.following.id);

    if (followingIds.length === 0) {
      return { essays: [] };
    }

    const essays = await this.essayRepository.getFollowingsEssays(followingIds, limit);
    const essaysDto = this.utilsService.transformToDto(PublicEssaysDto, essays);

    return { essays: essaysDto };
  }

  async categories(userId: number) {
    const categories = await this.categoryService.getCategoriesByUserId(userId);
    return { categories: categories };
  }

  async saveCategory(userId: number, categoryName: string) {
    await this.categoryService.saveCategory(userId, categoryName);
  }

  async updateCategory(userId: number, categoryId: number, categoryName: string) {
    await this.categoryService.updateCategory(userId, categoryId, categoryName);
  }

  async deleteCategory(userId: number, categoryId: number) {
    await this.categoryService.deleteCategory(userId, categoryId);
  }
}
