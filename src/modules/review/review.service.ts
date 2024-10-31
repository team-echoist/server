import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateEssayReqDto } from '../essay/dto/request/createEssayReq.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { UpdateEssayReqDto } from '../essay/dto/request/updateEssayReq.dto';
import { EssayStatus, ReviewQueueType } from '../../common/types/enum.types';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async saveReviewRequest(user: User, essay: Essay, data: CreateEssayReqDto | UpdateEssayReqDto) {
    const reviewType = this.mapEssayStatusToReviewQueueType(data.status);

    if (reviewType) {
      await this.reviewRepository.saveReviewRequest(user, essay, reviewType);
    }
  }

  private mapEssayStatusToReviewQueueType(status: EssayStatus): ReviewQueueType | null {
    switch (status) {
      case EssayStatus.PUBLISHED || EssayStatus.PUBLIC:
        return ReviewQueueType.PUBLIC;
      case EssayStatus.LINKEDOUT:
        return ReviewQueueType.LINKEDOUT;
      case EssayStatus.BURIAL:
        return ReviewQueueType.BURIAL;
      default:
        return null;
    }
  }

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findReviewByEssayId(essayId);
  }
}
