import { ReviewQueueType } from '../../../../../common/types/enum.types';
import { Essay } from '../../../../../entities/essay.entity';
import { ReviewQueue } from '../../../../../entities/reviewQueue.entity';
import { User } from '../../../../../entities/user.entity';

export interface IReviewRepository {
  saveReviewRequest(user: User, essay: Essay, type: ReviewQueueType): Promise<void>;

  findReviewByEssayId(essayId: number): Promise<ReviewQueue>;
}
