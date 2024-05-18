import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
import { EssaysInfoDto } from './dto/essaysInfo.dto';
import { FullEssayResDto } from './dto/response/fullEssayRes.dto';
import { UpdateEssayStatusReqDto } from './dto/request/updateEssayStatusReq.dto';
import { UpdateEssayDto } from '../essay/dto/updateEssay.dto';
import { FindManyOptions } from 'typeorm';

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
    const currentDate = this.utilsService.newDate();

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
    if (!essay) {
      throw new HttpException('No essay found.', HttpStatus.BAD_REQUEST);
    }

    if (data.actionType === 'approved') {
      essay.published = false;
      essay.linkedOut = false;
      await this.essayRepository.saveEssay(essay);
      // todo 여기에 앱 푸쉬알림이랑 메일링 추가해야할듯
    }
    await this.syncReportsProcessed(essayId, userId, data);
    return;
  }

  @Transactional()
  async syncReportsProcessed(essayId: number, adminId: number, data: ProcessReqDto) {
    const reports = await this.adminRepository.findReportByEssayId(essayId);
    if (!reports.length)
      throw new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND);

    for (const report of reports) {
      report.processed = true;
      report.processedDate = new Date();
      await this.adminRepository.saveReport(report);

      const newHistory = new ProcessedHistory();
      newHistory.comment = data.comment;
      newHistory.actionType = data.actionType;
      newHistory.target = 'report';
      newHistory.processor = adminId;
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
  async processReview(adminId: number, reviewId: number, data: ProcessReqDto) {
    const review = await this.adminRepository.getReview(reviewId);
    review.processed = true;

    if (data.actionType === 'approved')
      review.type === 'published'
        ? (review.essay.published = true)
        : (review.essay.linkedOut = true);
    await this.essayRepository.saveEssay(review.essay);
    await this.adminRepository.saveReview(review);

    const newHistory = new ProcessedHistory();
    newHistory.comment = data.comment;
    newHistory.actionType = data.actionType;
    newHistory.processor = adminId;
    newHistory.review = review;
    newHistory.target = 'review';
    newHistory.processedDate = new Date();
    await this.adminRepository.saveHistory(newHistory);

    // todo 유저에게 결과 메일 또는 푸쉬알림

    return;
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

  @Transactional()
  async updateUser(adminId: number, userId: number, data: UpdateFullUserReqDto) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userService.updateUser(userId, data);

    const newHistory = new ProcessedHistory();
    newHistory.actionType = 'updated';
    newHistory.target = 'user';

    if (data.monitored) {
      newHistory.actionType = 'monitored';
    }
    if (data.banned) {
      newHistory.actionType = 'banned';
    }
    newHistory.processor = adminId;
    newHistory.user = user;
    newHistory.processedDate = new Date();

    await this.adminRepository.saveHistory(newHistory);

    if (data.banned) {
      await this.handleBannedUser(userId);
    }

    if (data.banned === false) {
      await this.essayRepository.restoreAllEssay(userId);
    }

    return await this.getUser(userId);
  }

  private async handleBannedUser(userId: number) {
    const deletedEssayIds = await this.essayRepository.deleteAllEssay(userId);
    console.log(deletedEssayIds);
    await this.adminRepository.handleBannedReports(deletedEssayIds);
    await this.adminRepository.handleBannedReviews(userId);
    return;
  }

  async getFullEssays(page: number, limit: number) {
    const { essays, total } = await this.essayRepository.findFullEssays(page, limit);
    const totalPage: number = Math.ceil(total / limit);
    const data = essays.map((essay) => ({
      ...essay,
      authorId: essay.author.id,
      categoryId: essay.category?.id ?? null,
      reportCount: essay?.reports ? essay.reports.length : null,
      reviewCount: essay?.createdDate ? essay.reviews.length : null,
    }));

    const essaysDto = plainToInstance(EssaysInfoDto, data, { excludeExtraneousValues: true });
    return { essays: essaysDto, total, page, totalPage };
  }

  async getFullEssay(essayId: number) {
    const essay = await this.essayRepository.findFullEssay(essayId);
    return plainToInstance(FullEssayResDto, essay, { excludeExtraneousValues: true });
  }

  @Transactional()
  async updateEssayStatus(adminId: number, essayId: number, data: UpdateEssayStatusReqDto) {
    const essay = await this.essayRepository.findFullEssay(essayId);
    if (!essay) {
      throw new NotFoundException(`Essay with ID ${essayId} not found`);
    }

    const newHistory = new ProcessedHistory();
    newHistory.target = 'essay';

    const updateData = new UpdateEssayDto();

    if (data.published !== undefined) {
      newHistory.actionType = 'unpublished';
      updateData.published = data.published;
    }
    if (data.linkedOut !== undefined) {
      newHistory.actionType = 'unlinkedout';
      updateData.linkedOut = data.linkedOut;
    }

    const processData: ProcessReqDto = {
      comment: '',
      actionType: 'pending',
    };
    if (essay.reviews) {
      await this.processReview(adminId, essay.reviews[0].id, processData);
    }
    if (essay.reports) {
      await this.syncReportsProcessed(essayId, adminId, processData);
    }

    newHistory.processor = adminId;
    newHistory.essay = essay;
    newHistory.processedDate = new Date();

    await this.adminRepository.saveHistory(newHistory);
    await this.essayRepository.updateEssay(essay, updateData);

    return await this.getFullEssay(essayId);
  }

  async getHistories(page: number, limit: number, target?: string, action?: string) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereConditions: any = {};
    if (target) {
      whereConditions.target = target;
    }
    if (action) {
      whereConditions.actionType = action;
    }

    const query: FindManyOptions<ProcessedHistory> = {
      skip,
      take,
      order: { processedDate: 'DESC' },
      relations: ['report', 'review', 'user', 'essay'],
      where: whereConditions,
    };

    const { histories, total } = await this.adminRepository.getHistories(query);
    const totalPage: number = Math.ceil(total / limit);
    const historiesDto = plainToInstance(HistoriesResDto, histories, {
      excludeExtraneousValues: true,
    });

    return { histories: historiesDto, totalPage, page, total };
  }
}
