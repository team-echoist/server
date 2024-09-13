import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { Essay } from '../../entities/essay.entity';
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
import { Release } from '../../entities/release.entity';
import { ReleaseResDto } from '../support/dto/response/releaseRes.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AlertService } from '../alert/alert.service';
import { GeulroquisService } from '../geulroquis/geulroquis.service';
import { CronService } from '../cron/cron.service';
import { Server } from '../../entities/server.entity';
import { VersionsResDto } from '../support/dto/response/versionsRes.dto';
import { NicknameService } from '../nickname/nickname.service';
import { ActionType, EssayStatus, UserStatus } from '../../common/types/enum.types';
import { GeulroquisCountResDto } from '../geulroquis/dto/response/geulroquisCountRes.dto';
import { GeulroquisRepository } from '../geulroquis/geulroquis.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request as ExpressRequest } from 'express';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository,
    private readonly essayRepository: EssayRepository,
    private readonly userService: UserService,
    private readonly supportService: SupportService,
    private readonly supportRepository: SupportRepository,
    private readonly alertService: AlertService,
    private readonly geulroquisService: GeulroquisService,
    private readonly geulroquisRepository: GeulroquisRepository,
    private readonly nicknameService: NicknameService,
    private readonly mailService: MailService,
    private readonly awsService: AwsService,
    private readonly cronService: CronService,
    private readonly utilsService: UtilsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('admin') private readonly adminQueue: Queue,
  ) {}

  private async adminCacheKey(id: number) {
    return `admin_${id}`;
  }
  private readonly serverCacheKey = 'server_status';

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
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);

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
    const essay = await this.essayRepository.findPublishedEssayById(essayId);
    if (!essay) throw new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.BAD_REQUEST);

    if (essay.status === EssayStatus.PRIVATE)
      throw new HttpException('비공개 에세이 입니다.', HttpStatus.BAD_REQUEST);

    if (data.actionType === 'approved') await this.handleApprovedAction(essay);

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
      throw new HttpException('이 에세이에 대한 신고를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    console.log(
      `Adding syncReportsProcessed job for essay ${essayId} with ${reports.length} reports`,
    );

    const combinedReports = reports.map((report) => ({ ...report, adminId, data }));

    console.log(`Adding to adminQueue: ${JSON.stringify(combinedReports)}`);

    const batchSize = 5;
    for (let i = 0; i < combinedReports.length; i += batchSize) {
      const batch = combinedReports.slice(i, i + batchSize);
      await this.adminQueue.add(
        `syncReportsProcessed`,
        { batch, adminId, data },
        {
          attempts: 5,
          backoff: 5000,
          delay: i * 3000,
        },
      );
    }

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
      case 'release':
        history.release = target;
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

    const processedUsers = users.map((user) => {
      if (user.deletedDate) {
        user.nickname = 'deleted_user';
      }
      return user;
    });

    const totalPage: number = Math.ceil(total / limit);
    const userDtos = this.utilsService.transformToDto(FullUserResDto, processedUsers);

    return { users: userDtos, totalPage, page, total };
  }

  async searchUser(email: string) {
    const user = await this.userRepository.findUserByEmail(email);

    return this.utilsService.transformToDto(UserDetailResDto, user);
  }

  async getUser(userId: number) {
    const user = await this.userRepository.findUserDetailById(userId);

    if (user.deletedDate) user.nickname = 'deleted_user';

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
    if (essay.author.deletedDate) {
      essay.author.nickname = 'deleted_user';
    }
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
    if (admin && (await bcrypt.compare(password, admin.password)) && admin.activated === true) {
      return admin;
    }
    return null;
  }

  async validateSwagger(name: string, password: string) {
    const admin = await this.adminRepository.findByName(name);
    if (admin && (await bcrypt.compare(password, admin.password)) && admin.activated === true) {
      return admin;
    }
    return false;
  }

  async validatePayload(id: number) {
    const cacheKey = await this.adminCacheKey(id);
    const cachedAdmin = await this.redis.get(cacheKey);

    let admin = cachedAdmin ? JSON.parse(cachedAdmin) : null;
    if (!admin) {
      admin = await this.adminRepository.findAdmin(id);
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
      throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
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
    adminData.password = await bcrypt.hash(data.password, 12);

    await this.adminRepository.saveAdmin(adminData);

    return { message: 'Wait for the root administrator to confirm.' };
  }

  private async adminCheckDuplicates(email: string) {
    const result = await this.adminRepository.findByEmail(email);
    if (result) {
      throw new HttpException('이미 사용중인 이메일입니다.', HttpStatus.CONFLICT);
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

    await this.redis.del('latestNotice');

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

    await this.redis.del('latestNotice');

    return this.utilsService.transformToDto(NoticeWithProcessorResDto, savedNotice);
  }

  @Transactional()
  async deleteNotice(adminId: number, announcementId: number) {
    const processor = await this.adminRepository.findAdmin(adminId);
    const notice = await this.supportRepository.findNotice(announcementId);

    const newNotice = {
      ...notice,
      processor: processor,
      deletedDate: new Date(),
    };

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'notice',
      newNotice,
      processor,
    );
    await this.adminRepository.saveHistory(newHistory);

    await this.redis.del('latestNotice');
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

  @Transactional()
  async createRelease(adminId: number, content: string) {
    const processor = await this.adminRepository.findAdmin(adminId);

    const newRelease = new Release();
    newRelease.content = content;
    newRelease.processor = processor;

    await this.redis.del('latestRelease');

    await this.supportRepository.saveRelease(newRelease);

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'release',
      newRelease,
      processor,
    );

    await this.adminRepository.saveHistory(newHistory);
  }

  async updateRelease(adminId: number, releaseId: number, content: string) {
    const processor = await this.adminRepository.findAdmin(adminId);

    const release = await this.supportRepository.findRelease(releaseId);
    release.content = content;
    release.processor = processor;

    await this.redis.del('latestRelease');

    await this.supportRepository.saveRelease(release);

    const newHistory = this.createProcessedHistory(
      ActionType.UPDATED,
      'release',
      release,
      processor,
    );

    await this.adminRepository.saveHistory(newHistory);
  }

  async deleteRelease(adminId: number, releaseId: number) {
    const processor = await this.adminRepository.findAdmin(adminId);
    const release = await this.supportRepository.findRelease(releaseId);
    const history = this.createProcessedHistory(ActionType.DELETED, 'release', release, processor);
    await this.adminRepository.saveHistory(history);

    await this.redis.del('latestRelease');

    await this.supportRepository.deleteRelease(releaseId);
  }

  async getReleases(page: number, limit: number) {
    const { releases, total } = await this.supportRepository.findReleases(page, limit);

    const totalPage = Math.ceil(total / limit);
    const releasesDto = this.utilsService.transformToDto(ReleaseResDto, releases);

    return { releases: releasesDto, total, page, totalPage };
  }

  async getRelease(releaseId: number) {
    const release = await this.supportRepository.findRelease(releaseId);

    return this.utilsService.transformToDto(ReleaseResDto, release);
  }

  async deleteUser(adminId: number, userId: number) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
    const todayDate = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);

    await this.userRepository.deleteAccount(userId, todayDate);
  }

  async deleteAllUser(adminId: number) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
    await this.userRepository.deleteAllAccount();
  }

  async getCronLogs(adminId: number, page: number, limit: number, key?: string) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
    return await this.cronService.getCronLogs(page, limit, key);
  }

  async saveGeulroquisImages(files: Express.Multer.File[]) {
    const uploadPromises = files.map(async (file) => {
      const newExt = file.originalname.split('.').pop();
      const imageName = this.utilsService.getUUID();
      const fileName = `geulroquis/${imageName}.${newExt}`;
      return await this.awsService.geulroquisUploadToS3(fileName, file, newExt);
    });

    const imageUrls = await Promise.all(uploadPromises);

    const savePromises = imageUrls.map((url) => this.geulroquisService.saveGeulroquis(url));
    await Promise.all(savePromises);
  }

  async getGeulroquis(page: number, limit: number) {
    return this.geulroquisService.getGeulroquis(page, limit);
  }

  @Transactional()
  async getGeulroquisCount() {
    const total = await this.geulroquisRepository.countTotalGeulroquis();
    const available = await this.geulroquisRepository.countAvailableGeulroquis();

    return this.utilsService.transformToDto(GeulroquisCountResDto, { total, available });
  }

  @Transactional()
  async changeTomorrowGeulroquis(geulroquisId: number) {
    const TomorrowGeulroquis = await this.geulroquisRepository.findTomorrowGeulroquis();

    if (TomorrowGeulroquis) {
      TomorrowGeulroquis.next = false;
      await this.geulroquisRepository.saveGeulroquis(TomorrowGeulroquis);
    } else {
      const currentGeulroquis = await this.geulroquisRepository.findCurrentGeulroquis();
      if (currentGeulroquis) {
        currentGeulroquis.current = false;
        currentGeulroquis.provided = true;
        currentGeulroquis.providedDate = new Date();

        await this.geulroquisRepository.saveGeulroquis(currentGeulroquis);
      }
      const geulroquis = await this.geulroquisRepository.findOneGeulroquis(geulroquisId);
      geulroquis.current = true;

      await this.geulroquisRepository.saveGeulroquis(geulroquis);
    }

    const nextGeulroquis = await this.geulroquisRepository.findOneGeulroquis(geulroquisId);
    nextGeulroquis.next = true;
    await this.geulroquisRepository.saveGeulroquis(nextGeulroquis);

    return;
  }

  async getServerStatus() {
    const cacheKey = this.serverCacheKey;

    let status = await this.redis.get(cacheKey);
    if (!status) {
      const currentStatus = await this.adminRepository.getCurrentServerStatus();
      await this.redis.set(cacheKey, currentStatus.status, 'EX', 3600);
      status = currentStatus.status;
    }

    return status;
  }

  async saveServerStatus(adminId: number, newStatus: string) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);

    let serverStatus = await this.adminRepository.getCurrentServerStatus();
    if (!serverStatus) {
      serverStatus = new Server();
    }
    serverStatus.status = newStatus;

    const updatedServer = await this.adminRepository.saveServer(serverStatus);

    await this.redis.del(this.serverCacheKey);

    return updatedServer.status;
  }

  async getAppVersions() {
    const versions = await this.supportService.findAllVersions();

    return this.utilsService.transformToDto(VersionsResDto, versions);
  }

  async deleteAllDevice(adminId: number) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
    return this.supportRepository.deleteAllDevice();
  }

  async updateAppVersion(versionId: number, version: string) {
    await this.supportService.updateAppVersion(versionId, version);
  }

  async requestClearDatabase(adminId: number) {
    if (adminId !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);

    const admin = await this.adminRepository.findAdmin(adminId);

    const token = await this.utilsService.generateVerifyToken();

    const adminData = { email: admin.email, id: admin.id };

    await this.redis.set(token, JSON.stringify(adminData), 'EX', 600);

    await this.mailService.rootAuthenticationEmail(admin.email, token);
  }

  @Transactional()
  async clearDatabase(token: string) {
    const rootAdmin = await this.redis.get(token);

    if (!rootAdmin)
      throw new HttpException('유효하지 않거나 만료된 토큰입니다.', HttpStatus.BAD_REQUEST);

    const { email, id } = JSON.parse(rootAdmin);

    if (id !== 1) throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);

    await this.adminRepository.clearDatabase();
    await this.nicknameService.resetNickname();
    await this.resetRootAdmin();
  }

  async resetRootAdmin() {
    const root = await this.adminRepository.findAdmin(1);
    const hashedPassword = await bcrypt.hash(this.configService.get<string>('ROOT_PASSWORD'), 12);

    root.email = this.configService.get<string>('ROOT_EMAIL');
    root.name = this.configService.get<string>('ROOT_NAME');
    root.password = hashedPassword;
    root.activated = true;
    await this.adminRepository.saveAdmin(root);
  }

  async deleteAdmin(rootAdminId: number, adminId: number) {
    if (rootAdminId !== 1 && adminId === 1)
      throw new HttpException('접근 권한이 없습니다.', HttpStatus.FORBIDDEN);

    await this.adminRepository.deleteAdminById(adminId);
  }

  async generateAdminAccessToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '30m',
    });
  }

  async generateAdminRefreshToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }

  async adminRefreshToken(refreshToken: string) {
    let payload = await this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    payload = { username: payload.username, sub: payload.sub };

    return await this.generateAdminAccessToken(payload);
  }

  async login(req: ExpressRequest) {
    const accessPayload = { username: req.user.email, sub: req.user.id };
    const refreshPayload = { username: req.user.email, sub: req.user.id, device: req.device };

    const refreshToken = await this.generateAdminRefreshToken(refreshPayload);
    await this.redis.set(`${refreshToken}:${req.user.id}:admin`, 'used', 'EX', 29 * 60 + 50);

    return {
      accessToken: await this.generateAdminAccessToken(accessPayload),
      refreshToken: refreshToken,
    };
  }

  async clearRootAdminVerify() {
    const token = await this.utilsService.generateVerifyToken();

    await this.redis.set(token, '이게뭔일이람', 'EX', 600);

    await this.mailService.rootInitAuthenticationEmail(
      this.configService.get<string>('ROOT_EMAIL'),
      token,
    );
  }

  async clearRootAdmin(token: string) {
    const cached = await this.redis.get(token);

    if (!cached)
      throw new HttpException('유효하지 않거나 만료된 토큰입니다.', HttpStatus.BAD_REQUEST);

    await this.resetRootAdmin();
  }
}
