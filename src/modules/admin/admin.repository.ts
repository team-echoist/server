import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { Essay } from '../../entities/essay.entity';

export class AdminRepository {
  @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>;
  @InjectRepository(ReportQueue) private readonly reportRepository: Repository<ReportQueue>;
  @InjectRepository(ReviewQueue) private readonly reviewRepository: Repository<ReviewQueue>;
  @InjectRepository(ProcessedHistory)
  private readonly processedRepository: Repository<ProcessedHistory>;

  async totalSubscriberCount(today: Date) {
    return this.subscriptionRepository.count({
      where: {
        endDate: Between(today, new Date('2100-01-01')),
      },
    });
  }

  async todaySubscribers(todayStart: Date, todayEnd: Date) {
    return this.subscriptionRepository.count({
      where: {
        createdDate: Between(todayStart, todayEnd),
      },
    });
  }

  async unprocessedReports() {
    return this.reportRepository.count({
      where: { processed: false },
    });
  }

  async unprocessedReviews() {
    return this.reviewRepository.count({
      where: { processed: false },
    });
  }

  async countMonthlySubscriptionPayments(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('EXTRACT(DAY FROM subscription.createdDate)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('subscription.createdDate >= :start AND subscription.createdDate <= :end', {
        start: firstDayOfMonth,
        end: lastDayOfMonth,
      })
      .groupBy('EXTRACT(DAY FROM subscription.createdDate)')
      .orderBy('EXTRACT(DAY FROM subscription.createdDate)', 'ASC')
      .getRawMany();
  }

  async countYearlySubscriptionPayments(year: number) {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('EXTRACT(MONTH FROM subscription.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM subscription.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM subscription.createdDate)')
      .orderBy('EXTRACT(MONTH FROM subscription.createdDate)', 'ASC')
      .getRawMany();
  }

  async getReports(sort: string, page: number, limit: number) {
    const totalReports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .getCount();

    const totalEssaysWithReports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .select('essay.id')
      .distinct(true)
      .getRawMany();

    const totalEssay = totalEssaysWithReports.length;

    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .select('essay.id', 'essayId')
      .addSelect('essay.title', 'essayTitle')
      .addSelect('COUNT(report.id)', 'reportCount')
      .addSelect('MIN(report.createdDate)', 'oldestReportDate')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .groupBy('essay.id');

    if (sort === 'oldest') {
      queryBuilder.addOrderBy('MIN(report.createdDate)', 'ASC');
    } else if (sort === 'most') {
      queryBuilder.addOrderBy('COUNT(report.id)', 'DESC');
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);
    const reports = await queryBuilder.getRawMany();

    return { reports, totalReports, totalEssay };
  }

  async findReportByEssayId(essayId: number) {
    return this.reportRepository.find({ where: { essay: { id: essayId } } });
  }

  async saveReport(report: ReportQueue) {
    await this.reportRepository.save(report);
    return;
  }

  async saveHistory(history: ProcessedHistory) {
    await this.processedRepository.save(history);
    return;
  }

  async getReviews(page: number, limit: number) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { processed: false },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'essay'],
      order: { createdDate: 'DESC' },
    });
    return { reviews, total };
  }

  async getReview(reviewId: number) {
    return this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['essay', 'user'],
    });
  }

  async saveReview(review: ReviewQueue) {
    return this.reviewRepository.save(review);
  }

  async getHistories(query: FindManyOptions) {
    const [histories, total] = await this.processedRepository.findAndCount(query);
    return { histories, total };
  }

  async handleBannedReports(essayIds: number[]) {
    if (essayIds.length > 0) {
      await this.reportRepository
        .createQueryBuilder()
        .update(ReportQueue)
        .set({ processed: true, processedDate: new Date() })
        .where('essay_id IN (:...essayIds)', { essayIds })
        .execute();
    }
  }

  async handleBannedReviews(userId: number) {
    await this.reviewRepository
      .createQueryBuilder()
      .update(ReviewQueue)
      .set({ processed: true, processedDate: () => 'CURRENT_TIMESTAMP' })
      .where('user_id = :userId', { userId })
      .execute();
  }
}
