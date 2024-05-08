import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { DayUtils } from '../../common/utils/day.utils';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { plainToInstance } from 'class-transformer';
import { ReportsDto } from './dto/reports.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { Transactional } from 'typeorm-transactional';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { ReviewDto } from './dto/review.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly mailService: MailService,
    private readonly dayUtils: DayUtils,
  ) {}

  @Transactional()
  async dashboard() {
    const today = new Date();
    const todayStart = this.dayUtils.startOfDay(today);
    const todayEnd = this.dayUtils.endOfDay(today);

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
  async processReports(userId: number, essayId: number, processReqDto: ProcessReqDto) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay) throw new HttpException('No essay found.', HttpStatus.BAD_REQUEST);

    if (processReqDto.result === 'Approved') {
      essay.published = false;
      essay.linkedOut = false;
      await this.essayRepository.saveEssay(essay);
      // todo 여기에 앱 푸쉬알림이랑 메일링 추가해야할듯
    }
    await this.syncProcessed(essayId, userId, processReqDto.result, processReqDto.comment);
    return;
  }

  @Transactional()
  async syncProcessed(essayId: number, userId: number, result: string, comment: string) {
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
}
