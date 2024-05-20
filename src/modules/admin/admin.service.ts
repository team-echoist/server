import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
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
import { SavedAdminResDto } from './dto/response/savedAdminRes.dto';
import { EssaysInfoDto } from './dto/essaysInfo.dto';
import { FullEssayResDto } from './dto/response/fullEssayRes.dto';
import { UpdateEssayStatusReqDto } from './dto/request/updateEssayStatusReq.dto';
import { Essay } from '../../entities/essay.entity';
import * as bcrypt from 'bcrypt';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';

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

    return this.utilsService.transformToDto(DashboardResDto, {
      totalUser,
      currentSubscriber,
      todaySubscribers,
      totalEssays,
      todayEssays,
      publishedEssays,
      linkedOutEssays,
      unprocessedReports,
      unprocessedReviews,
    });
  }

  private determineUserActionType(data: UpdateFullUserReqDto): string {
    if (data.banned) return 'banned';
    if (data.monitored) return 'monitored';
    return 'updated';
  }

  private determineEssayActionType(data: UpdateEssayStatusReqDto): string {
    if (data.published !== undefined) return 'unpublished';
    if (data.linkedOut !== undefined) return 'unlinkedout';
    return 'updated';
  }

  private async handleUserBanStatus(userId: number, banned: boolean) {
    if (banned) {
      await this.handleBannedUser(userId);
    } else {
      await this.essayRepository.restoreAllEssay(userId);
    }
  }

  private async handleBannedUser(userId: number) {
    const deletedEssayIds = await this.essayRepository.deleteAllEssay(userId);
    await this.adminRepository.handleBannedReports(deletedEssayIds);
    await this.adminRepository.handleBannedReviews(userId);
  }

  private buildWhereConditions(target?: string, action?: string): any {
    const whereConditions: any = {};
    if (target) {
      whereConditions.target = target;
    }
    if (action) {
      whereConditions.actionType = action;
    }
    return whereConditions;
  }

  private async handleEssayDependencies(essay: Essay, adminId: number, processData: ProcessReqDto) {
    if (essay.reviews) {
      await this.processReview(adminId, essay.reviews[0].id, processData);
    }
    if (essay.reports) {
      await this.syncReportsProcessed(essay.id, adminId, processData);
    }
  }

  async createAdmin(userId: number, data: CreateAdminReqDto) {
    if (userId !== 1) throw new HttpException('You are not authorized.', HttpStatus.FORBIDDEN);
    await this.authService.checkEmail(data.email);
    data.password = await bcrypt.hash(data.password, 10);
    const newAdmin: CreateAdminDto = {
      ...data,
      role: 'admin',
    };
    const savedAdmin = await this.authRepository.createUser(newAdmin);

    return this.utilsService.transformToDto(SavedAdminResDto, savedAdmin);
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

  @Transactional()
  async getReports(sort: string, page: number, limit: number): Promise<ReportsResDto> {
    const { reports, totalReports, totalEssay } = await this.adminRepository.getReports(
      sort,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(totalEssay / limit);
    const reportDtos = this.utilsService.transformToDto(ReportsDto, reports) as ReportsDto[];

    return { reports: reportDtos, totalReports, totalEssay, totalPage, page };
  }

  async getReportDetails(essayId: number) {
    const essayWithReports = await this.essayRepository.getReportDetails(essayId);

    return this.utilsService.transformToDto(ReportDetailResDto, {
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
    });
  }

  @Transactional()
  async processReports(userId: number, essayId: number, data: ProcessReqDto) {
    const essay = await this.essayRepository.findEssayById(essayId);
    if (!essay) {
      throw new HttpException('No essay found.', HttpStatus.BAD_REQUEST);
    }

    if (data.actionType === 'approved') {
      await this.handleApprovedAction(essay);
    }

    await this.syncReportsProcessed(essayId, userId, data);
  }

  private async handleApprovedAction(essay: Essay) {
    essay.published = false;
    essay.linkedOut = false;
    await this.essayRepository.saveEssay(essay);
    // TODO: 여기에 앱 푸쉬 알림 및 메일링 추가
  }

  @Transactional()
  async syncReportsProcessed(essayId: number, adminId: number, data: ProcessReqDto) {
    const reports = await this.adminRepository.findReportByEssayId(essayId);
    if (!reports.length)
      throw new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND);

    await Promise.all(
      reports.map(async (report) => {
        await this.processReport(report);
        const newHistory = this.createProcessedHistory(
          data.actionType,
          'report',
          report,
          adminId,
          data.comment,
        );
        await this.adminRepository.saveHistory(newHistory);
      }),
    );
  }

  private async processReport(report: ReportQueue) {
    report.processed = true;
    report.processedDate = new Date();
    await this.adminRepository.saveReport(report);
  }

  private createProcessedHistory(
    actionType: string,
    targetName: string,
    target: any,
    adminId: number,
    comment?: string,
  ): ProcessedHistory {
    const newHistory = new ProcessedHistory();
    newHistory.actionType = actionType;
    newHistory.target = targetName;
    newHistory.processor = adminId;
    newHistory.processedDate = new Date();

    this.assignTargetToHistory(newHistory, targetName, target);

    if (comment) {
      newHistory.comment = comment;
    }

    return newHistory;
  }

  private assignTargetToHistory(history: ProcessedHistory, targetName: string, target: any) {
    switch (targetName) {
      case 'user':
        history.user = target;
        break;
      case 'report':
        history.report = target;
        break;
      case 'essay':
        history.essay = target;
        break;
      case 'review':
        history.review = target;
        break;
      default:
        throw new Error(`Unknown target name: ${targetName}`);
    }
  }

  async getReviews(page: number, limit: number) {
    const { reviews, total } = await this.adminRepository.getReviews(page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const reviewsDto = this.utilsService.transformToDto(
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
    ) as ReviewDto[];

    return { reviews: reviewsDto, totalPage, page, total };
  }

  async detailReview(reviewId: number) {
    const review = await this.adminRepository.getReview(reviewId);
    return this.utilsService.transformToDto(DetailReviewResDto, review);
  }

  @Transactional()
  async processReview(adminId: number, reviewId: number, data: ProcessReqDto) {
    const review = await this.adminRepository.getReview(reviewId);
    review.processed = true;

    this.handleReviewAction(review, data.actionType);

    await this.essayRepository.saveEssay(review.essay);
    await this.adminRepository.saveReview(review);

    const newHistory = this.createProcessedHistory(
      data.actionType,
      'review',
      review,
      adminId,
      data.comment,
    );
    await this.adminRepository.saveHistory(newHistory);

    // todo 유저에게 결과 메일 또는 푸쉬알림
  }

  private handleReviewAction(review: ReviewQueue, actionType: string) {
    if (actionType === 'approved') {
      if (review.type === 'published') {
        review.essay.published = true;
      } else {
        review.essay.linkedOut = true;
      }
    }
  }

  async getUsers(filter: string, page: number, limit: number) {
    const today = new Date();
    const { users, total } = await this.userRepository.findUsers(today, filter, page, limit);

    const totalPage: number = Math.ceil(total / limit);
    const userDtos = this.utilsService.transformToDto(FullUserResDto, users);

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
    return this.utilsService.transformToDto(UserDetailResDto, data);
  }

  @Transactional()
  async updateUser(adminId: number, userId: number, data: UpdateFullUserReqDto) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userService.updateUser(userId, data);

    const actionType = this.determineUserActionType(data);
    const newHistory = this.createProcessedHistory(actionType, 'user', user, adminId);

    await this.adminRepository.saveHistory(newHistory);

    if (data.banned !== undefined) {
      await this.handleUserBanStatus(userId, data.banned);
    }

    return await this.getUser(userId);
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

    const essaysDto = this.utilsService.transformToDto(EssaysInfoDto, data);
    return { essays: essaysDto, total, page, totalPage };
  }

  async getFullEssay(essayId: number) {
    const essay = await this.essayRepository.findFullEssay(essayId);
    return this.utilsService.transformToDto(FullEssayResDto, essay);
  }

  @Transactional()
  async updateEssayStatus(adminId: number, essayId: number, data: UpdateEssayStatusReqDto) {
    const essay = await this.essayRepository.findFullEssay(essayId);
    if (!essay) {
      throw new NotFoundException(`Essay with ID ${essayId} not found`);
    }

    const actionType = this.determineEssayActionType(data);
    const newHistory = this.createProcessedHistory(actionType, 'essay', essay, adminId);

    const updateData = {
      ...essay,
    };

    if (data.published !== undefined) {
      updateData.published = data.published;
    }
    if (data.linkedOut !== undefined) {
      updateData.linkedOut = data.linkedOut;
    }

    const processData = new ProcessReqDto();
    processData.actionType = 'pending';

    await this.handleEssayDependencies(essay, adminId, processData);

    await this.adminRepository.saveHistory(newHistory);
    await this.essayRepository.updateEssay(essay, updateData);

    return await this.getFullEssay(essayId);
  }

  @Transactional()
  async getHistories(page: number, limit: number, target?: string, action?: string) {
    const whereConditions: any = this.buildWhereConditions(target, action);

    const query: FindManyOptions<ProcessedHistory> = {
      skip: (page - 1) * limit,
      take: limit,
      order: { processedDate: 'DESC' },
      relations: ['report', 'review', 'user', 'essay'],
      where: whereConditions,
    };

    const { histories, total } = await this.adminRepository.getHistories(query);
    const totalPage: number = Math.ceil(total / limit);
    const historiesDto = this.utilsService.transformToDto(HistoriesResDto, histories);

    return { histories: historiesDto, totalPage, page, total };
  }
}
