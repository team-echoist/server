import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { DayUtils } from '../../common/utils/day.utils';
import { DashboardResDto } from './dto/dashboardRes.dto';
import { plainToInstance } from 'class-transformer';
import { ReportListDto } from './dto/reportList.dto';
import { EssayWithReportsDto } from './dto/essayWithReports.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly mailService: MailService,
    private readonly dayUtils: DayUtils,
  ) {}

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
        strategy: 'exposeAll',
        excludeExtraneousValues: true,
      },
    );
  }

  async getReports(sort: string, page: number, limit: number) {
    const { reports, total } = await this.adminRepository.getReports(sort, page, limit);
    const totalPage: number = Math.ceil(total / limit);
    const reportDtos = plainToInstance(ReportListDto, reports, {
      strategy: 'exposeAll',
      excludeExtraneousValues: true,
    });

    return { reports: reportDtos, total, totalPage, page };
  }

  async getEssayReports(essayId: number) {
    const essayWithReports = await this.essayRepository.getEssayReports(essayId);
    return plainToInstance(
      EssayWithReportsDto,
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
        strategy: 'exposeAll',
        excludeExtraneousValues: true,
      },
    );
  }
}
