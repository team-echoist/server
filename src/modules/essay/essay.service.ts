import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { plainToInstance } from 'class-transformer';
import { EssayRepository } from './essay.repository';
import { UserRepository } from '../user/user.repository';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { FindMyEssayQueryInterface } from '../../common/interfaces/essay/findMyEssayQuery.interface';
import { RedisService } from '../redis/redis.service';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';

@Injectable()
export class EssayService {
  constructor(
    private readonly redisService: RedisService,
    private readonly essayRepository: EssayRepository,
    private readonly userRepository: UserRepository,
  ) {}

  @Transactional()
  async saveEssay(requester: Express.User, device: string, data: CreateEssayReqDto) {
    const user = await this.userRepository.findById(requester.id);
    let category: any;

    if (data.categoryId) {
      category = await this.essayRepository.findCategoryById(user, data.categoryId);
      if (!category) throw new HttpException('Category not found.', HttpStatus.BAD_REQUEST);
    }

    const essayData = {
      ...data,
      device: device,
      author: user,
      category: category,
    };

    if (requester.banned) {
      const adjustedData = {
        ...essayData,
        published: false,
        linkedOut: false,
      };

      const savedBannedEssay = await this.essayRepository.saveEssay(adjustedData);

      const essay = await this.essayRepository.findEssayById(savedBannedEssay.id);

      const bannedEssay = plainToInstance(EssayResDto, essay, {
        strategy: 'exposeAll',
        excludeExtraneousValues: true,
      });

      const reviewType = data.published ? 'published' : data.linkedOut ? 'linked_out' : null;

      if (reviewType) {
        await this.essayRepository.saveReviewRequest(user, essay, reviewType);
        return {
          ...bannedEssay,
          message: 'Your essay is under review due to policy violations.',
        };
      }
      return bannedEssay;
    }

    const savedEssay = await this.essayRepository.saveEssay(essayData);
    return plainToInstance(EssayResDto, savedEssay, {
      excludeExtraneousValues: true,
    });
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: number, data: UpdateEssayReqDto) {
    const user = await this.userRepository.findById(requester.id);
    let category: any;
    let message = '';

    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay) throw new Error('Essay not found');

    if (data.categoryId) {
      category = await this.essayRepository.findCategoryById(user, data.categoryId);
    }

    const essayData = {
      ...data,
      category: category,
    };

    const isUnderReview = await this.essayRepository.findReviewByEssayId(essayId);
    if ((isUnderReview && data.linkedOut) || (isUnderReview && data.published))
      throw new HttpException(
        'Update rejected: Essay is currently under review',
        HttpStatus.BAD_REQUEST,
      );

    if (requester.banned) {
      if (data.published || data.linkedOut) {
        const reviewType = data.published ? 'published' : 'linked_out';
        await this.essayRepository.saveReviewRequest(user, essay, reviewType);
        message = 'Review request created due to policy violations.';
      }
      essayData.published = false;
      essayData.linkedOut = false;
    }

    await this.essayRepository.updateEssay(essay, essayData);
    const updatedEssay = await this.essayRepository.findEssayById(essay.id);
    const resultData = plainToInstance(EssayResDto, updatedEssay, {
      excludeExtraneousValues: true,
    });

    // Return data and message, handling is done in the interceptor
    return { ...resultData, message: message };
  }

  async getMyEssay(
    userId: number,
    published: boolean,
    categoryId: number,
    page: number,
    limit: number,
  ) {
    const query: FindMyEssayQueryInterface = {
      author: { id: userId },
      category: { id: categoryId },
      linkedOut: false,
    };
    if (published === true) query.published = true;

    const { essays, total } = await this.essayRepository.findMyEssay(query, page, limit);
    const totalPage: number = Math.ceil(total / limit);
    const essayDtos = plainToInstance(EssayResDto, essays, {
      strategy: 'exposeAll',
      excludeExtraneousValues: true,
    });

    return { essays: essayDtos, total, totalPage, page };
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
}
