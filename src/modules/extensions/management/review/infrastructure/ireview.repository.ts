import { User } from '../../../../../entities/user.entity';
import { Essay } from '../../../../../entities/essay.entity';
import { ReviewQueueType } from '../../../../../common/types/enum.types';
import { ReviewQueue } from '../../../../../entities/reviewQueue.entity';

export interface IReviewRepository {
  saveReviewRequest(user: User, essay: Essay, type: ReviewQueueType): Promise<void>;

  findReviewByEssayId(essayId: number): Promise<ReviewQueue>;
}
