import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CreateEssayReqDto } from './dto/createEssayReq.dto';
import { EssayRepository } from './essay.repository';
import { UserRepository } from '../user/user.repository';
import Redis from 'ioredis';

@Injectable()
export class EssayService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly essayRepository: EssayRepository,
    private readonly userRepository: UserRepository,
  ) {}

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
      console.log(data.publish);

      if (reviewType) {
        await this.essayRepository.createReviewRequest(user, essay, reviewType);
        return { ...createdEssay, message: 'Your essay is under review due to policy violations.' };
      }
      return createdEssay;
    }

    return this.essayRepository.createEssay(essayData);
  }
}
