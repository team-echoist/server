import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { plainToInstance } from 'class-transformer';
import { ReportsDto } from './dto/reports.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { Transactional } from 'typeorm-transactional';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { ReviewDto } from './dto/review.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';
import { DetailReviewResDto } from './dto/response/detailReviewRes.dto';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly mailService: MailService,
    private readonly utilsService: UtilsService,
  ) {}

  @Transactional()
  async dashboard() {
    const today = new Date();
    const todayStart = this.utilsService.startOfDay(today);
    const todayEnd = this.utilsService.endOfDay(today);

    const totalUser = await this.userRepository.usersCount();
    const currentSubscriber = await this.adminRepository.totalSubscriberCount(today);
    const todaySubscribers = await this.adminRepository.todaySubscribers(todayStart, todayEnd);
    const totalEssays = await this.essayRepository.totalEssayCount();
    const todayEssays = await this.essayRepository.todayEssays(todayStart, todayEnd);
    const publishedEssays = await this.essayRepository.totalPublishedEssays();
    const linkedOutEssays = await this.essayRepository.totalLinkedOutEssays();
    const unprocessedReports = await this.adminRepository.unprocessedReports();
    const unprocessedReviews = await this.adminRepository.unprocessedReviews();

    return plainToInstance(
      DashboardResDto,
      {
        totalUser,
        currentSubscriber,
        todaySubscribers,
        totalEssays,
        todayEssays,
        publishedEssays,
        linkedOutEssays,
        unprocessedReports,
        unprocessedReviews,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async countEssaysByDailyThisMonth(queryYear: number, queryMonth: number) {
    const currentDate = new Date();

    const year = queryYear ? queryYear : currentDate.getFullYear();
    const month = queryMonth ? queryMonth - 1 : currentDate.getMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    const rawData = await this.essayRepository.countEssaysByDailyThisMonth(
      firstDayOfMonth,
      lastDayOfMonth,
    );

    const result: Record<string, number> = {};

    for (let date = firstDayOfMonth; date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      result[dateKey] = 0;
    }

    rawData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      result[dateKey] = parseInt(item.count);
    });

    return result;
  }

  async countEssaysByMonthlyThisYear(queryYear?: number) {
    const year = queryYear ? queryYear : new Date().getUTCFullYear();

    const rawData = await this.essayRepository.countEssaysByMonthlyThisYear(year);

    const result: Record<string, number> = {};

    for (let month = 1; month <= 12; month++) {
      result[`${month}`] = 0;
    }

    rawData.forEach((item) => {
      const monthKey = item.month.toString();
      result[monthKey] = parseInt(item.count);
    });

    return result;
  }

  @Transactional()
  async getReports(sort: string, page: number, limit: number): Promise<ReportsResDto> {
    const { reports, totalReports, totalEssay } = await this.adminRepository.getReports(
      sort,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(totalEssay / limit);
    const reportDtos = plainToInstance(ReportsDto, reports, {
      excludeExtraneousValues: true,
    });

    return { reports: reportDtos, totalReports, totalEssay, totalPage, page };
  }

  async getReportDetails(essayId: number) {
    const essayWithReports = await this.essayRepository.getReportDetails(essayId);
    return plainToInstance(
      ReportDetailResDto,
      {
        ...essayWithReports,
        authorId: essayWithReports.author ? essayWithReports.author.id : null,
        reports: essayWithReports.reports.map((report) => ({
          id: report.id,
          reason: report.reason,
          processed: report.processed,
          processedDate: report.processedDate,
          createdDate: report.createdDate,
          reporterId: report.reporter ? report.reporter.id : null,
        })),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Transactional()
  async processReports(userId: number, essayId: number, data: ProcessReqDto) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay) throw new HttpException('No essay found.', HttpStatus.BAD_REQUEST);

    if (data.result === 'Approved') {
      essay.published = false;
      essay.linkedOut = false;
      await this.essayRepository.saveEssay(essay);
      // todo 여기에 앱 푸쉬알림이랑 메일링 추가해야할듯
    }
    await this.syncReportsProcessed(essayId, userId, data.result, data.comment);
    return;
  }

  @Transactional()
  async syncReportsProcessed(essayId: number, userId: number, result: string, comment: string) {
    const reports = await this.adminRepository.findReportByEssayId(essayId);
    if (!reports.length)
      throw new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND);

    for (const report of reports) {
      report.processed = true;
      report.processedDate = new Date();
      await this.adminRepository.saveReport(report);

      const newHistory = new ProcessedHistory();
      newHistory.comment = comment;
      newHistory.result = result;
      newHistory.processor = userId;
      newHistory.report = report;
      newHistory.processedDate = new Date();
      await this.adminRepository.saveHistory(newHistory);
    }
    return;
  }

  async getReviews(page: number, limit: number) {
    const { reviews, total } = await this.adminRepository.getReviews(page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const reviewsDto = plainToInstance(
      ReviewDto,
      reviews.map((review) => ({
        id: review.id,
        type: review.type,
        processed: review.processed,
        createDate: review.createdDate,
        processedDate: review.processedDate,
        userId: review.user.id,
        essayId: review.essay.id,
        essayTitle: review.essay.title,
      })),
      {
        excludeExtraneousValues: true,
      },
    );
    return { reviews: reviewsDto, totalPage, page, total };
  }

  async detailReview(reviewId: number) {
    const review = await this.adminRepository.getReview(reviewId);
    return plainToInstance(DetailReviewResDto, review, { excludeExtraneousValues: true });
  }

  @Transactional()
  async processReview(userId: number, reviewId: number, data: ProcessReqDto) {
    const review = await this.adminRepository.getReview(reviewId);
    review.processed = true;

    if (data.result === 'Approved')
      review.type === 'published'
        ? (review.essay.published = true)
        : (review.essay.linkedOut = true);
    await this.essayRepository.saveEssay(review.essay);
    await this.adminRepository.saveReview(review);

    const newHistory = new ProcessedHistory();
    newHistory.comment = data.comment;
    newHistory.result = data.result;
    newHistory.processor = userId;
    newHistory.review = review;
    newHistory.processedDate = new Date();
    await this.adminRepository.saveHistory(newHistory);

    // todo 유저에게 결과 메일 또는 푸쉬알림

    return;
  }
}
