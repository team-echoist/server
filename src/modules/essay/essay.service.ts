import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CreateEssayReqDto } from './dto/createEssayReq.dto';
import { EssayRepository } from './essay.repository';
import { UserRepository } from '../user/user.repository';
import Redis from 'ioredis';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class EssayService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
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
    if (requester.black) {
      const adjustedData = {
        ...essayData,
        publish: false,
        linkedOut: false,
      };
      const createdEssay = await this.essayRepository.createEssay(adjustedData);

      const essay = await this.essayRepository.findEssayById(createdEssay.id);
      const reviewType = data.publish ? 'publish' : data.linkedOut ? 'linked_out' : null;

      if (reviewType) {
        await this.essayRepository.createReviewRequest(user, essay, reviewType);
        return { ...createdEssay, message: 'Your essay is under review due to policy violations.' };
      }
      return createdEssay;
    }

    return this.essayRepository.createEssay(essayData);
  }

  @Transactional()
  async updateEssay(requester: Express.User, essayId: string, data: CreateEssayReqDto) {
    const user = await this.userRepository.findById(requester.id);
    const essay = await this.essayRepository.findEssayById(parseInt(essayId, 10));
    if (!essay) throw new Error('Essay not found');

    const isUnderReview = await this.essayRepository.findReviewByEssayId(parseInt(essayId, 10));
    if (isUnderReview) throw new Error('Update rejected: Essay is currently under review');

    if (requester.black) {
      if (data.publish || data.linkedOut) {
        const reviewType = data.publish ? 'publish' : data.linkedOut ? 'linked_out' : null;
        await this.essayRepository.createReviewRequest(user, essay, reviewType);
        return { essay, message: 'Review request created due to policy violations.' };
      }
      data.publish = false;
      data.linkedOut = false;
    }

    return await this.essayRepository.updateEssay(essay, data);
  }
}
