import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { plainToInstance } from 'class-transformer';
import { Transactional } from 'typeorm-transactional';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { ReportsDto } from './dto/reports.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReviewDto } from './dto/review.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';
import { DetailReviewResDto } from './dto/response/detailReviewRes.dto';
import { HistoriesResDto } from './dto/response/historiesRes.dto';
import { FullUserResDto } from './dto/response/fullUserRes.dto';
import { UserDetailResDto } from './dto/response/userDetailRes.dto';
import { UpdateFullUserReqDto } from './dto/request/updateFullUserReq.dto';
import { CreateAdminReqDto } from './dto/request/createAdminReq.dto';
import { AuthRepository } from '../auth/auth.repository';
import { CreateAdminDto } from './dto/createAdmin.dto';
import * as bcrypt from 'bcrypt';
import { SavedAdminResDto } from './dto/response/savedAdminRes.dto';
import { FullEssayResDto } from './dto/response/fullEssayRes.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly utilsService: UtilsService,
  ) {}

  async createAdmin(userId: number, data: CreateAdminReqDto) {
    if (userId !== 1) throw new HttpException('You are not authorized.', HttpStatus.FORBIDDEN);
    await this.authService.checkEmail(data.email);
    data.password = await bcrypt.hash(data.password, 10);
    const newAdmin: CreateAdminDto = {
      ...data,
      role: 'admin',
    };
    const savedAdmin = await this.authRepository.createUser(newAdmin);
    return plainToInstance(SavedAdminResDto, savedAdmin, { excludeExtraneousValues: true });
  }

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

    return await this.utilsService.formatDailyData(rawData, firstDayOfMonth, lastDayOfMonth);
  }

  async countEssaysByMonthlyThisYear(queryYear?: number) {
    const year = queryYear ? queryYear : new Date().getUTCFullYear();

    const rawData = await this.essayRepository.countEssaysByMonthlyThisYear(year);

    return this.utilsService.formatMonthlyData(rawData);
  }

  async countDailyRegistrations(queryYear: number, queryMonth: number) {
    const currentDate = new Date();
    const year = queryYear ? queryYear : currentDate.getFullYear();
    const month = queryMonth ? queryMonth - 1 : currentDate.getMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    const rawData = await this.userRepository.countDailyRegistrations(
      firstDayOfMonth,
      lastDayOfMonth,
    );

    return await this.utilsService.formatDailyData(rawData, firstDayOfMonth, lastDayOfMonth);
  }

  async countMonthlyRegistrations(queryYear: number) {
    const year = queryYear ? queryYear : new Date().getUTCFullYear();
    const rawData = await this.userRepository.countMonthlyRegistrations(year);

    return this.utilsService.formatMonthlyData(rawData);
  }

  async countMonthlySubscriptionPayments(queryYear: number, queryMonth: number) {
    const currentDate = new Date();
    const year = queryYear ? queryYear : currentDate.getFullYear();
    const month = queryMonth ? queryMonth - 1 : currentDate.getMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    const rawData = await this.adminRepository.countMonthlySubscriptionPayments(
      firstDayOfMonth,
      lastDayOfMonth,
    );

    return await this.utilsService.formatDailyData(rawData, firstDayOfMonth, lastDayOfMonth);
  }

  async countYearlySubscriptionPayments(queryYear: number) {
    const year = queryYear ? queryYear : new Date().getUTCFullYear();
    const rawData = await this.adminRepository.countYearlySubscriptionPayments(year);

    return await this.utilsService.formatMonthlyData(rawData);
  }

  // -------------------------------------------------------------------- Statistics API up to here

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

  async getHistories(page: number, limit: number) {
    const { histories, total } = await this.adminRepository.getHistories(page, limit);
    const totalPage: number = Math.ceil(total / limit);
    const historiesDto = plainToInstance(HistoriesResDto, histories, {
      excludeExtraneousValues: true,
    });

    return { histories: historiesDto, totalPage, page, total };
  }

  async getUsers(filter: string, page: number, limit: number) {
    const today = new Date();
    const { users, total } = await this.userRepository.findUsers(today, filter, page, limit);

    const totalPage: number = Math.ceil(total / limit);
    const userDtos = plainToInstance(FullUserResDto, users, {
      excludeExtraneousValues: true,
    });
    return { users: userDtos, totalPage, page, total };
  }

  async getUser(userId: number) {
    const user = await this.userRepository.findUserDetailById(userId);
    const data = {
      ...user,
      reportCount: user.reports.length,
      essayCount: user.essays.length,
      reviewCount: user.reviews.length,
    };
    return plainToInstance(UserDetailResDto, data, { excludeExtraneousValues: true });
  }

  async updateUser(userId: number, data: UpdateFullUserReqDto) {
    await this.userService.updateUser(userId, data);
    return await this.getUser(userId);
  }

  async getEssays(page: number, limit: number) {
    const { essays, total } = await this.essayRepository.findEssays({}, page, limit);
    const totalPage: number = Math.ceil(total / limit);
    console.log(essays[0]);
    const data = essays.map((essay) => ({
      ...essay,
      authorId: essay.author.id,
      categoryId: essay.category?.id ?? null,
    }));

    const essaysDto = plainToInstance(FullEssayResDto, data, { excludeExtraneousValues: true });
    return { essays: essaysDto, total, page, totalPage };
  }
}
