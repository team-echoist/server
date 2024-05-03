import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';

export class AdminRepository {
  @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>;
  @InjectRepository(ReportQueue) private readonly reportRepository: Repository<ReportQueue>;
  @InjectRepository(ReviewQueue) private readonly reviewRepository: Repository<ReviewQueue>;

  async totalSubscriberCount(today: Date) {
    return await this.subscriptionRepository.count({
      where: {
        endDate: Between(today, new Date('2100-01-01')),
      },
    });
  }

  async todaySubscribers(todayStart: Date, todayEnd: Date) {
    return await this.subscriptionRepository.count({
      where: {
        createdDate: Between(todayStart, todayEnd),
      },
    });
  }

  async unprocessedReports() {
    return await this.reportRepository.count({
      where: { processed: false },
    });
  }

  async unprocessedReviews() {
    return await this.reviewRepository.count({
      where: { processed: false },
    });
  }
}
