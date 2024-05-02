import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { plainToInstance } from 'class-transformer';
import { EssayRepository } from './essay.repository';
import { UserRepository } from '../user/user.repository';
import { CreateEssayReqDto } from './dto/createEssayReq.dto';
import { EssayResDto } from './dto/essayRes.dto';
import { FindMyEssayQueryInterface } from '../../common/interfaces/essay/findMyEssayQuery.interface';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class EssayService {
  constructor(
    private readonly redisService: RedisService,
    private readonly essayRepository: EssayRepository,
    private readonly userRepository: UserRepository,
  ) {}

  @Transactional()
  async createEssay(requester: Express.User, device: string, data: CreateEssayReqDto) {
    const user = await this.userRepository.findById(requester.id);
    const essayData = {
      ...data,
      device: device,
      author: user,
    };
    if (requester.banned) {
      const adjustedData = {
        ...essayData,
        published: false,
        linkedOut: false,
      };
      const createdEssay = await this.essayRepository.createEssay(adjustedData);

      const essay = await this.essayRepository.findEssayById(createdEssay.id);
      const reviewType = data.published ? 'published' : data.linkedOut ? 'linked_out' : null;

      if (reviewType) {
        await this.essayRepository.createReviewRequest(user, essay, reviewType);
        return { ...createdEssay, message: 'Your essay is under review due to policy violations.' };
      }
      return createdEssay;
    }

    const createdEssay = await this.essayRepository.createEssay(essayData);

    await this.redisService.deleteCachePattern('essays-*');

    return plainToInstance(EssayResDto, createdEssay, {
      strategy: 'exposeAll',
      excludeExtraneousValues: true,
    });
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: number, data: CreateEssayReqDto) {
    const user = await this.userRepository.findById(requester.id);
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay) throw new Error('Essay not found');

    const isUnderReview = await this.essayRepository.findReviewByEssayId(essayId);
    if (isUnderReview)
      throw new HttpException(
        'Update rejected: Essay is currently under review',
        HttpStatus.BAD_REQUEST,
      );

    if (requester.banned) {
      if (data.published || data.linkedOut) {
        const reviewType = data.published ? 'published' : data.linkedOut ? 'linked_out' : null;
        await this.essayRepository.createReviewRequest(user, essay, reviewType);
        return { essay, message: 'Review request created due to policy violations.' };
      }
      data.published = false;
      data.linkedOut = false;
    }

    const updatedEssay = await this.essayRepository.updateEssay(essay, data);

    await this.redisService.deleteCachePattern('essays-*');

    return plainToInstance(EssayResDto, updatedEssay, {
      strategy: 'exposeAll',
      excludeExtraneousValues: true,
    });
  }

  async getMyEssay(
    userId: number,
    published: boolean,
    categoryId: number,
    page: number,
    limit: number,
  ) {
    const cacheKey = `essays-${userId}-${published}-${categoryId}-${page}-${limit}`;
    const cachedData = await this.redisService.getCached(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

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

    const result = { essays: essayDtos, total, totalPage, page };
    await this.redisService.setCached(cacheKey, result, 900);
    return result;
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
