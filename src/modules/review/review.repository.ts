import { InjectRepository } from '@nestjs/typeorm';
import { ReviewQueue, ReviewQueueType } from '../../entities/reviewQueue.entity';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';

export class ReviewRepository {
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
