import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IReviewRepository } from './ireview.repository';
import { ReviewQueueType } from '../../../../../common/types/enum.types';
import { Essay } from '../../../../../entities/essay.entity';
import { ReviewQueue } from '../../../../../entities/reviewQueue.entity';
import { User } from '../../../../../entities/user.entity';

export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(ReviewQueue)
    private readonly reviewRepository: Repository<ReviewQueue>,
  ) {}

  async saveReviewRequest(user: User, essay: Essay, type: ReviewQueueType) {
    await this.reviewRepository.save({
      user: user,
      essay: essay,
      type: type,
    });
  }

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findOne({ where: { essay: { id: essayId }, processed: false } });
  }
}
