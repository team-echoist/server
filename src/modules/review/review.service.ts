import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateEssayReqDto } from '../essay/dto/request/createEssayReq.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { UpdateEssayReqDto } from '../essay/dto/request/updateEssayReq.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async saveReviewRequest(user: User, essay: Essay, data: CreateEssayReqDto | UpdateEssayReqDto) {
    const reviewType = data.published ? 'published' : data.linkedOut ? 'linkedOut' : null;

    if (reviewType) {
      await this.reviewRepository.saveReviewRequest(user, essay, reviewType);
    }
  }

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findReviewByEssayId(essayId);
  }
}
