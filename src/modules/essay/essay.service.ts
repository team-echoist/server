import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { FindMyEssayQueryInterface } from '../../common/interfaces/essay/findMyEssayQuery.interface';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { EssayRepository } from './essay.repository';
import { UserRepository } from '../user/user.repository';
import { Essay } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';

@Injectable()
export class EssayService {
  constructor(
    private readonly essayRepository: EssayRepository,
    private readonly userRepository: UserRepository,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
  ) {}

  @Transactional()
  async saveEssay(requester: Express.User, device: string, data: CreateEssayReqDto) {
    const user = await this.userRepository.findUserById(requester.id);

    const category = await this.getCategory(user, data.categoryId);
    const tags = await this.getTags(data.tags);

    const essayData = {
      ...data,
      device: device,
      author: user,
      category: category,
      tags: tags,
    };

    if (requester.monitored) {
      return await this.handleMonitoredUser(user, essayData, data);
    }

    const savedEssay = await this.essayRepository.saveEssay(essayData);

    return this.utilsService.transformToDto(EssayResDto, savedEssay);
  }

  private async handleMonitoredUser(user: User, essayData: any, data: CreateEssayReqDto) {
    const adjustedData = {
      ...essayData,
      published: false,
      linkedOut: false,
    };

    const savedMonitoredEssay = await this.essayRepository.saveEssay(adjustedData);
    const essay = await this.essayRepository.findEssayById(savedMonitoredEssay.id);

    const monitoredEssay = this.utilsService.transformToDto(EssayResDto, essay);

    const reviewType = data.published ? 'published' : data.linkedOut ? 'linkedOut' : null;

    if (reviewType) {
      await this.essayRepository.saveReviewRequest(user, essay, reviewType);
      return {
        ...monitoredEssay,
        message: 'Your essay is under review due to policy violations.',
      };
    }

    return monitoredEssay;
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: number, data: UpdateEssayReqDto) {
    const user = await this.userRepository.findUserById(requester.id);
    const category = await this.getCategory(user, data.categoryId);
    const tags = await this.getTags(data.tags);

    const essay = await this.essayRepository.findEssayById(essayId);
    this.checkIfEssayUnderReview(essayId, data);

    let message = '';
    if (requester.monitored && (data.published || data.linkedOut)) {
      await this.createReviewRequest(user, essay, data);
      message = 'Review request created due to policy violations.';
    }

    await this.updateEssayData(essay, data, category, tags, requester);
    const updatedEssay = await this.essayRepository.findEssayById(essayId);
    const resultData = this.utilsService.transformToDto(EssayResDto, updatedEssay);

    return { ...resultData, message: message };
  }

  private async getCategory(user: User, categoryId?: number): Promise<Category> {
    if (!categoryId) return null;
    const category = await this.essayRepository.findCategoryById(user, categoryId);
    if (!category) throw new HttpException('Category not found.', HttpStatus.BAD_REQUEST);
    return category;
  }

  private async getTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) return [];
    return await this.processTags(tagNames);
  }

  private async processTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) return [];

    return await Promise.all(
      tagNames.map(async (name) => {
        let tag = await this.essayRepository.findTag(name);
        if (!tag) {
          tag = await this.essayRepository.saveTag(name);
        }
        return tag;
      }),
    );
  }

  private checkIfEssayUnderReview(essayId: number, data: UpdateEssayReqDto) {
    const isUnderReview = this.essayRepository.findReviewByEssayId(essayId);
    if ((isUnderReview && data.linkedOut) || (isUnderReview && data.published)) {
      throw new HttpException(
        'Update rejected: Essay is currently under review',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async createReviewRequest(user: User, essay: Essay, data: UpdateEssayReqDto) {
    const reviewType = data.published ? 'published' : 'linkedOut';
    await this.essayRepository.saveReviewRequest(user, essay, reviewType);
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
      published: requester.monitored ? false : data.published,
      linkedOut: requester.monitored ? false : data.linkedOut,
    };
    return await this.essayRepository.updateEssay(essay, essayData);
  }

  async getMyEssay(
    userId: number,
    published: boolean,
    categoryId: number,
    page: number,
    limit: number,
  ) {
    const query = this.buildEssayQuery(userId, published, categoryId);
    const { essays, total } = await this.essayRepository.findEssays(query, page, limit);

    const totalPage: number = Math.ceil(total / limit);
    const essayDtos = this.utilsService.transformToDto(EssayResDto, essays);

    return { essays: essayDtos, total, totalPage, page };
  }

  private buildEssayQuery(
    userId: number,
    published: boolean,
    categoryId: number,
  ): FindMyEssayQueryInterface {
    const query: FindMyEssayQueryInterface = {
      author: { id: userId },
      linkedOut: false,
    };

    if (categoryId !== undefined) {
      query.category = { id: categoryId };
    }

    if (published !== undefined) {
      query.published = published;
    }

    return query;
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
}
