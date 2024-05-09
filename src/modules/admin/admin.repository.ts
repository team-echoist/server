import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';

export class AdminRepository {
  @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>;
  @InjectRepository(ReportQueue) private readonly reportRepository: Repository<ReportQueue>;
  @InjectRepository(ReviewQueue) private readonly reviewRepository: Repository<ReviewQueue>;
  @InjectRepository(ProcessedHistory)
  private readonly processedRepository: Repository<ProcessedHistory>;

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
  }

  async saveHistory(history: ProcessedHistory) {
    await this.processedRepository.save(history);
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
    return await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['essay', 'user'],
    });
  }

  async saveReview(review: ReviewQueue) {
    return await this.reviewRepository.save(review);
  }
}
