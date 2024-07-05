import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ActionType, ProcessedHistory } from '../../entities/processedHistory.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { UserStatus } from '../../entities/user.entity';
import { Admin } from '../../entities/admin.entity';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { UtilsService } from '../utils/utils.service';
import { AdminRepository } from './admin.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { DashboardResDto } from './dto/response/dashboardRes.dto';
import { ReportResDto } from './dto/response/reportRes.dto';
import { ReportDetailResDto } from './dto/response/reportDetailRes.dto';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReviewResDto } from './dto/response/reviewRes.dto';
import { ReportsResDto } from './dto/response/reportsRes.dto';
import { DetailReviewResDto } from './dto/response/detailReviewRes.dto';
import { HistoriesResDto } from './dto/response/historiesRes.dto';
import { FullUserResDto } from './dto/response/fullUserRes.dto';
import { UserDetailResDto } from './dto/response/userDetailRes.dto';
import { UpdateFullUserReqDto } from './dto/request/updateFullUserReq.dto';
import { CreateAdminReqDto } from './dto/request/createAdminReq.dto';
import { CreateAdminDto } from './dto/createAdmin.dto';
import { SavedAdminResDto } from './dto/response/savedAdminRes.dto';
import { EssayInfoResDto } from './dto/response/essayInfoRes.dto';
import { FullEssayResDto } from './dto/response/fullEssayRes.dto';
import { UpdateEssayStatusReqDto } from './dto/request/updateEssayStatusReq.dto';
import { AdminResDto } from './dto/response/adminRes.dto';
import { AdminUpdateReqDto } from './dto/request/adminUpdateReq.dto';
import { ProfileImageUrlResDto } from '../user/dto/response/profileImageUrlRes.dto';
import { AwsService } from '../aws/aws.service';
import { AdminRegisterReqDto } from './dto/request/adminRegisterReq.dto';
import { CreateNoticeReqDto } from './dto/request/createNoticeReq.dto';
import { Notice } from '../../entities/notice.entity';
import { UpdateNoticeReqDto } from './dto/request/updateNoticeReq.dto';
import { SupportRepository } from '../support/support.repository';
import { SupportService } from '../support/support.service';
import { NoticeWithProcessorResDto } from './dto/response/noticeWithProcessorRes.dto';
import { InquirySummaryResDto } from '../support/dto/response/inquirySummaryRes.dto';
import { FullInquiryResDto } from './dto/response/fullInquiryRes.dto';
import { UpdatedHistory } from '../../entities/updatedHistory.entity';
import { UpdatedHistoryResDto } from '../support/dto/response/updatedHistoryRes.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
    private readonly supportService: SupportService,
    private readonly supportRepository: SupportRepository,
    private readonly alertService: AlertService,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('admin') private readonly adminQueue: Queue,
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

  private determineUserActionType(data: UpdateFullUserReqDto) {
    if (data.status === UserStatus.BANNED) return ActionType.BANNED;
    if (data.status === UserStatus.MONITORED) return ActionType.MONITORED;
    return ActionType.UPDATED;
  }

  private determineEssayActionType(essay: Essay, data: UpdateEssayStatusReqDto) {
    if (data.status !== undefined) {
      switch (data.status) {
        case EssayStatus.PRIVATE:
          return essay.status === EssayStatus.PUBLISHED
            ? ActionType.UNPUBLISHED
            : essay.status === EssayStatus.LINKEDOUT
              ? ActionType.UNLINKEDOUT
              : ActionType.UPDATED;
        case EssayStatus.PUBLISHED:
          return essay.status === EssayStatus.LINKEDOUT
            ? ActionType.UNLINKEDOUT
            : ActionType.PUBLISHED;
        case EssayStatus.LINKEDOUT:
          return ActionType.LINKEDOUT;
        default:
          return ActionType.UPDATED;
      }
    }
    return ActionType.UPDATED;
  }

  private async handleUserBanStatus(userId: number, status: UserStatus) {
    if (status === UserStatus.BANNED) await this.handleBannedUser(userId);
    if (status === UserStatus.ACTIVATED) await this.essayRepository.restoreAllEssay(userId);
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
    if (essay.reviews && essay.reviews.length > 0) {
      await this.processReview(adminId, essay.reviews[0].id, processData);
    }
    if (essay.reports && essay.reports.length > 0) {
      await this.syncReportsProcessed(essay.id, adminId, processData);
    }
  }

  async createAdmin(adminId: number, data: CreateAdminReqDto) {
    if (adminId !== 1) throw new HttpException('You are not authorized.', HttpStatus.FORBIDDEN);

    await this.adminCheckDuplicates(data.email);

    data.password = await bcrypt.hash(data.password, 10);
    const newAdmin: CreateAdminDto = {
      ...data,
      activated: true,
    };
    const savedAdmin = await this.adminRepository.saveAdmin(newAdmin);

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
    const reportDtos = this.utilsService.transformToDto(ReportResDto, reports) as ReportResDto[];

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
    await this.userService.decreaseReputation(essay.author.id, 10);

    if (essay.status === EssayStatus.LINKEDOUT) await this.essayRepository.deleteEssay(essay);

    if (essay.status === EssayStatus.PUBLISHED) {
      essay.status = EssayStatus.PRIVATE;
      await this.essayRepository.saveEssay(essay);
      await this.alertService.createReportResultAlerts(essay);
      await this.alertService.sendPushAlertReportProcessed(essay);
    }
  }

  @Transactional()
  async syncReportsProcessed(essayId: number, adminId: number, data: ProcessReqDto) {
    const reports = await this.adminRepository.findReportByEssayId(essayId);

    if (!reports.length)
      throw new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND);

    console.log(
      `Adding syncReportsProcessed job for essay ${essayId} with ${reports.length} reports`,
    );

    const combinedReports = reports.map((report) => ({ ...report, adminId, data }));
    await this.adminQueue.add('syncReportsProcessed', { reports: combinedReports });
    await this.alertService.createAndSendReportProcessedAlerts(reports, data.actionType);
  }

  async processBatchReports(reports: ReportQueue[], adminId: number, data: ProcessReqDto) {
    const admin = await this.adminRepository.findAdmin(adminId);

    for (const report of reports) {
      await this.processReport(report);
      const newHistory = this.createProcessedHistory(
        data.actionType,
        'report',
        report,
        admin,
        data.comment,
      );
      await this.adminRepository.saveHistory(newHistory);
    }
  }

  private async processReport(report: ReportQueue) {
    report.processed = true;
    report.processedDate = new Date();
    await this.adminRepository.saveReport(report);
  }

  private createProcessedHistory(
    actionType: ActionType,
    targetName: string,
    target: any,
    admin: Admin,
    comment?: string,
  ): ProcessedHistory {
    const newHistory = new ProcessedHistory();
    newHistory.actionType = actionType;
    newHistory.target = targetName;
    newHistory.processor = admin;
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
      case 'notice':
        history.notice = target;
        break;
      case 'inquiry':
        history.inquiry = target;
        break;
      default:
        throw new Error(`Unknown target name: ${targetName}`);
    }
  }

  async getReviews(page: number, limit: number) {
    const { reviews, total } = await this.adminRepository.getReviews(page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const reviewsDto = this.utilsService.transformToDto(
      ReviewResDto,
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
    ) as ReviewResDto[];

    return { reviews: reviewsDto, totalPage, page, total };
  }

  async detailReview(reviewId: number) {
    const review = await this.adminRepository.getReview(reviewId);
    return this.utilsService.transformToDto(DetailReviewResDto, review);
  }

  @Transactional()
  async processReview(adminId: number, reviewId: number, data: ProcessReqDto) {
    const admin = await this.adminRepository.findAdmin(adminId);
    const review = await this.adminRepository.getReview(reviewId);
    review.processed = true;

    this.handleReviewAction(review, data.actionType);

    await this.essayRepository.saveEssay(review.essay);
    await this.adminRepository.saveReview(review);

    const newHistory = this.createProcessedHistory(
      data.actionType,
      'review',
      review,
      admin,
      data.comment,
    );
    await this.adminRepository.saveHistory(newHistory);

    await this.alertService.createReviewResultAlert(review, data.actionType);
    await this.alertService.sendPushReviewResultAlert(review.user.id, data.actionType);
  }

  private handleReviewAction(review: ReviewQueue, actionType: string) {
    if (actionType === ActionType.APPROVED) {
      if (review.type === 'published') {
        review.essay.status = EssayStatus.PUBLISHED;
      } else {
        review.essay.status = EssayStatus.LINKEDOUT;
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
    const admin = await this.adminRepository.findAdmin(adminId);
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userService.updateUser(userId, data);

    const actionType = this.determineUserActionType(data);
    const newHistory = this.createProcessedHistory(actionType, 'user', user, admin);

    await this.adminRepository.saveHistory(newHistory);

    if (data.status !== undefined) {
      await this.handleUserBanStatus(userId, data.status);
    }

    return await this.getUser(userId);
  }

  async getFullEssays(page: number, limit: number) {
    const { essays, total } = await this.essayRepository.findFullEssays(page, limit);
    const totalPage: number = Math.ceil(total / limit);
    const data = essays.map((essay) => ({
      ...essay,
      authorId: essay.author.id,
      storyId: essay.story?.id ?? null,
      reportCount: essay?.reports ? essay.reports.length : null,
      reviewCount: essay?.createdDate ? essay.reviews.length : null,
    }));

    const essaysDto = this.utilsService.transformToDto(EssayInfoResDto, data);
    return { essays: essaysDto, total, page, totalPage };
  }

  async getFullEssay(essayId: number) {
    const essay = await this.essayRepository.findFullEssay(essayId);
    return this.utilsService.transformToDto(FullEssayResDto, essay);
  }

  @Transactional()
  async updateEssayStatus(adminId: number, essayId: number, data: UpdateEssayStatusReqDto) {
    const admin = await this.adminRepository.findAdmin(adminId);
    const essay = await this.essayRepository.findFullEssay(essayId);
    if (!essay) {
      throw new NotFoundException(`Essay with ID ${essayId} not found`);
    }

    const actionType = this.determineEssayActionType(essay, data);
    const newHistory = this.createProcessedHistory(actionType, 'essay', essay, admin);

    const updateData = {
      ...essay,
      status: data.status,
    };

    const processData = new ProcessReqDto();
    processData.actionType = ActionType.PENDING;

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
      relations: ['report', 'review', 'user', 'essay', 'processor', 'notice', 'inquiry'],
      where: whereConditions,
    };

    const { histories, total } = await this.adminRepository.getHistories(query);
    const totalPage: number = Math.ceil(total / limit);
    const historiesDto = this.utilsService.transformToDto(HistoriesResDto, histories);

    return { histories: historiesDto, totalPage, page, total };
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.adminRepository.findByEmail(email);
    if (admin && (await bcrypt.compare(password, admin.password))) {
      return admin;
    }
    return null;
  }

  async validatePayload(email: string) {
    const cacheKey = `admin_${email}`;
    const cachedAdmin = await this.redis.get(cacheKey);
    let admin = cachedAdmin ? JSON.parse(cachedAdmin) : null;
    if (!admin) {
      admin = await this.adminRepository.findByEmail(email);
      if (admin) {
        await this.redis.set(cacheKey, JSON.stringify(admin), 'EX', 600);
        return admin;
      }
    }
    return !admin ? null : admin;
  }

  async getAdmins(activated?: boolean) {
    const admins = await this.adminRepository.findAdmins(activated);
    const adminsDto = this.utilsService.transformToDto(AdminResDto, admins);

    return { admins: adminsDto };
  }

  async getAdmin(adminId: number) {
    const admin = await this.adminRepository.findAdmin(adminId);
    return this.utilsService.transformToDto(AdminResDto, admin);
  }

  async updateAdmin(adminId: number, data: AdminUpdateReqDto) {
    const admin = await this.adminRepository.findAdmin(adminId);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updatedAdmin = await this.adminRepository.updateAdmin(admin, data);
    return this.utilsService.transformToDto(AdminResDto, updatedAdmin);
  }

  async saveProfileImage(adminId: number, file: Express.Multer.File) {
    const admin = await this.adminRepository.findAdmin(adminId);
    const newExt = file.originalname.split('.').pop();

    let fileName: any;
    if (admin.profileImage) {
      const urlParts = admin.profileImage.split('/').pop();
      fileName = `profile/${urlParts}`;
    } else {
      const imageName = this.utilsService.getUUID();
      fileName = `profile/${imageName}`;
    }

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);
    admin.profileImage = imageUrl;
    await this.adminRepository.saveAdmin(admin);

    return this.utilsService.transformToDto(ProfileImageUrlResDto, { imageUrl });
  }

  async deleteProfileImage(adminId: number) {
    const admin = await this.adminRepository.findAdmin(adminId);

    if (!admin.profileImage) {
      throw new NotFoundException('No profile image to delete');
    }

    const urlParts = admin.profileImage.split('/').pop();
    const fileName = `profile/${urlParts}`;

    await this.awsService.deleteImageFromS3(fileName);
    admin.profileImage = null;
    await this.adminRepository.saveAdmin(admin);

    return { message: 'Profile image deleted successfully' };
  }

  async activationSettings(rootAdminId: number, adminId: number, activated: boolean) {
    const rootAdmin = await this.adminRepository.findAdmin(rootAdminId);
    if (rootAdmin.id !== 1) {
      throw new HttpException('Root administrator only', HttpStatus.FORBIDDEN);
    }
    const admin = await this.adminRepository.findAdmin(adminId);
    admin.activated = activated;

    const updatedAdmin = await this.adminRepository.saveAdmin(admin);

    if (activated === true) await this.mailService.sendActiveComplete(admin.email);

    return this.utilsService.transformToDto(AdminResDto, updatedAdmin);
  }

  @Transactional()
  async register(data: AdminRegisterReqDto) {
    await this.adminCheckDuplicates(data.email);

    const adminData: CreateAdminDto = {
      ...data,
      activated: false,
    };
    adminData.password = await bcrypt.hash(data.password, 10);

    await this.adminRepository.saveAdmin(adminData);

    return { message: 'Wait for the root administrator to confirm.' };
  }

  private async adminCheckDuplicates(email: string) {
    const result = await this.adminRepository.findByEmail(email);
    if (result) {
      throw new HttpException('Email already in use.', HttpStatus.CONFLICT);
    }
    return;
  }

  async getInactiveAdmins() {
    const admins = await this.adminRepository.findAdmins(false);

    const adminsDto = this.utilsService.transformToDto(AdminResDto, admins);

    return { admins: adminsDto };
  }

  @Transactional()
  async createNotice(adminId: number, data: CreateNoticeReqDto) {
    const processor = await this.adminRepository.findAdmin(adminId);
    const newNotice = new Notice();
    newNotice.title = data.title;
    newNotice.content = data.content;
    newNotice.processor = processor;

    const savedNotice = await this.supportRepository.saveNotice(newNotice);

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'notice',
      savedNotice,
      processor,
    );

    await this.adminRepository.saveHistory(newHistory);

    return this.utilsService.transformToDto(NoticeWithProcessorResDto, savedNotice);
  }

  @Transactional()
  async updateNotice(adminId: number, announcementId: number, data: UpdateNoticeReqDto) {
    const processor = await this.adminRepository.findAdmin(adminId);
    const Notice = await this.supportRepository.findNotice(announcementId);

    const newNotice = {
      ...Notice,
      ...data,
      processor: processor,
    };

    const savedNotice = await this.supportRepository.saveNotice(newNotice);

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'notice',
      savedNotice,
      processor,
    );

    await this.adminRepository.saveHistory(newHistory);

    return this.utilsService.transformToDto(NoticeWithProcessorResDto, savedNotice);
  }

  @Transactional()
  async deleteNotice(adminId: number, announcementId: number) {
    const processor = await this.adminRepository.findAdmin(adminId);
    const Notice = await this.supportRepository.findNotice(announcementId);

    const newNotice = {
      ...Notice,
      processor: processor,
      deletedDate: new Date(),
    };

    await this.supportRepository.saveNotice(newNotice);
  }

  async getNotices(page: number, limit: number) {
    return await this.supportService.getNotices(page, limit);
  }

  async getNotice(noticeId: number) {
    const notice = await this.supportRepository.findNotice(noticeId);

    return this.utilsService.transformToDto(NoticeWithProcessorResDto, notice);
  }

  async getInquiries(page: number, limit: number, status: 'all' | 'unprocessed') {
    const { inquiries, total } = await this.supportRepository.findAdminInquiries(
      page,
      limit,
      status,
    );

    const totalPage: number = Math.ceil(total / limit);
    const inquiriesDto = this.utilsService.transformToDto(InquirySummaryResDto, inquiries);

    return { inquiries: inquiriesDto, total, page, totalPage };
  }

  async getInquiry(inquiryId: number) {
    const inquiry = await this.supportRepository.findInquiryById(inquiryId);

    return this.utilsService.transformToDto(FullInquiryResDto, inquiry);
  }

  async createAnswer(adminId: number, inquiryId: number, answer: string) {
    const inquiry = await this.supportRepository.findInquiryById(inquiryId);
    const processor = await this.adminRepository.findAdmin(adminId);

    inquiry.answer = answer;
    inquiry.processed = true;

    await this.supportRepository.saveInquiry(inquiry);

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'inquiry',
      inquiry,
      processor,
    );

    await this.adminRepository.saveHistory(newHistory);
  }

  async createUpdateHistory(adminId: number, history: string) {
    const processor = await this.adminRepository.findAdmin(adminId);

    const newUpdateHistory = new UpdatedHistory();
    newUpdateHistory.history = history;
    newUpdateHistory.processor = processor;

    await this.supportRepository.saveUpdateHistory(newUpdateHistory);
  }

  async getAllUpdateHistories(page: number, limit: number) {
    const { histories, total } = await this.supportRepository.findAllUpdateHistories(page, limit);

    const totalPage = Math.ceil(total / limit);
    const historiesDto = this.utilsService.transformToDto(UpdatedHistoryResDto, histories);

    return { histories: historiesDto, total, page, totalPage };
  }

  async getUpdateHistory(historyId: number) {
    const history = await this.supportRepository.findUpdatedHistory(historyId);

    return this.utilsService.transformToDto(UpdatedHistoryResDto, history);
  }
}
