import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';
import { UserRepository } from '../../user/user.repository';
import { EssayRepository } from '../../essay/essay.repository';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../user/user.service';
import { UtilsService } from '../../utils/utils.service';
import { MailService } from '../../mail/mail.service';
import { AuthRepository } from '../../auth/auth.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateAdminReqDto } from '../dto/request/createAdminReq.dto';
import { ProcessReqDto } from '../dto/request/processReq.dto';
import { UpdateFullUserReqDto } from '../dto/request/updateFullUserReq.dto';
import { EssayStatus } from '../../../entities/essay.entity';
import { UserStatus } from '../../../entities/user.entity';
import { ActionType } from '../../../entities/processedHistory.entity';
import { UpdateEssayStatusReqDto } from '../dto/request/updateEssayStatusReq.dto';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

describe('AdminService', () => {
  let adminService: AdminService;

  const mockAdminRepository = {
    totalSubscriberCount: jest.fn(),
    todaySubscribers: jest.fn(),
    unprocessedReports: jest.fn(),
    unprocessedReviews: jest.fn(),
    countMonthlySubscriptionPayments: jest.fn(),
    countYearlySubscriptionPayments: jest.fn(),
    getReports: jest.fn(),
    findReportByEssayId: jest.fn(),
    saveReport: jest.fn(),
    saveHistory: jest.fn(),
    getReview: jest.fn(),
    getReviews: jest.fn(),
    saveReview: jest.fn(),
    getHistories: jest.fn(),
    handleBannedReports: jest.fn(),
    handleBannedReviews: jest.fn(),
  };
  const mockUserRepository = {
    usersCount: jest.fn(),
    countDailyRegistrations: jest.fn(),
    countMonthlyRegistrations: jest.fn(),
    findUsers: jest.fn(),
    findUserDetailById: jest.fn(),
    findUserById: jest.fn(),
  };
  const mockEssayRepository = {
    totalEssayCount: jest.fn(),
    todayEssays: jest.fn(),
    totalPublishedEssays: jest.fn(),
    totalLinkedOutEssays: jest.fn(),
    countEssaysByDailyThisMonth: jest.fn(),
    countEssaysByMonthlyThisYear: jest.fn(),
    getReportDetails: jest.fn(),
    findEssayById: jest.fn(),
    saveEssay: jest.fn(),
    findFullEssays: jest.fn(),
    findFullEssay: jest.fn(),
    updateEssay: jest.fn(),
    deleteAllEssay: jest.fn(),
  };
  const mockAuthService = {
    checkEmail: jest.fn(),
  };
  const mockUserService = {
    updateUser: jest.fn(),
  };
  const mockUtilsService = {
    startOfDay: jest.fn(),
    endOfDay: jest.fn(),
    formatDailyData: jest.fn(),
    formatMonthlyData: jest.fn(),
    newDate: jest.fn(),
    transformToDto: jest.fn(),
  };
  const mockAuthRepository = {
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AdminRepository, useValue: mockAdminRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: EssayRepository, useValue: mockEssayRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: UtilsService, useValue: mockUtilsService },
        { provide: MailService, useValue: {} },
        { provide: AuthRepository, useValue: mockAuthRepository },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
  });

  describe('createAdmin', () => {
    it('루트관리자가 아닌 경우 에러', async () => {
      const createAdminDto: CreateAdminReqDto = { email: 'test@test.com', password: 'password' };
      await expect(adminService.createAdmin(2, createAdminDto)).rejects.toThrow(
        new HttpException('You are not authorized.', HttpStatus.FORBIDDEN),
      );
    });

    it('관리자 계정 생성 성공', async () => {
      const createAdminDto: CreateAdminReqDto = { email: 'test@test.com', password: 'password' };
      const savedAdmin = { id: 1, email: 'test@test.com', role: 'admin' };

      mockAuthService.checkEmail.mockResolvedValue(true);
      mockAuthRepository.createUser.mockResolvedValue(savedAdmin);
      mockUtilsService.transformToDto.mockResolvedValue(savedAdmin);

      const result = await adminService.createAdmin(1, createAdminDto);

      expect(mockAuthService.checkEmail).toHaveBeenCalledWith(createAdminDto.email);
      expect(result).toEqual(expect.objectContaining({ email: 'test@test.com' }));
    });
  });

  describe('dashboard', () => {
    it('대시보드 데이터', async () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      mockUtilsService.startOfDay.mockReturnValue(todayStart);
      mockUtilsService.endOfDay.mockReturnValue(todayEnd);

      mockUserRepository.usersCount.mockResolvedValue(100);
      mockAdminRepository.totalSubscriberCount.mockResolvedValue(50);
      mockAdminRepository.todaySubscribers.mockResolvedValue(5);
      mockEssayRepository.totalEssayCount.mockResolvedValue(200);
      mockEssayRepository.todayEssays.mockResolvedValue(10);
      mockEssayRepository.totalPublishedEssays.mockResolvedValue(150);
      mockEssayRepository.totalLinkedOutEssays.mockResolvedValue(20);
      mockAdminRepository.unprocessedReports.mockResolvedValue(3);
      mockAdminRepository.unprocessedReviews.mockResolvedValue(4);

      mockUtilsService.transformToDto.mockReturnValue({
        totalUser: 100,
        currentSubscriber: 50,
        todaySubscribers: 5,
        totalEssays: 200,
        todayEssays: 10,
        publishedEssays: 150,
        linkedOutEssays: 20,
        unprocessedReports: 3,
        unprocessedReviews: 4,
      });

      const result = await adminService.dashboard();

      expect(mockUserRepository.usersCount).toHaveBeenCalled();
      expect(mockAdminRepository.totalSubscriberCount).toHaveBeenCalled();
      expect(mockAdminRepository.todaySubscribers).toHaveBeenCalledWith(todayStart, todayEnd);
      expect(mockEssayRepository.totalEssayCount).toHaveBeenCalled();
      expect(mockEssayRepository.todayEssays).toHaveBeenCalledWith(todayStart, todayEnd);
      expect(mockEssayRepository.totalPublishedEssays).toHaveBeenCalled();
      expect(mockEssayRepository.totalLinkedOutEssays).toHaveBeenCalled();
      expect(mockAdminRepository.unprocessedReports).toHaveBeenCalled();
      expect(mockAdminRepository.unprocessedReviews).toHaveBeenCalled();

      expect(result).toEqual({
        totalUser: 100,
        currentSubscriber: 50,
        todaySubscribers: 5,
        totalEssays: 200,
        todayEssays: 10,
        publishedEssays: 150,
        linkedOutEssays: 20,
        unprocessedReports: 3,
        unprocessedReviews: 4,
      });
    });
  });

  describe('countEssaysByDailyThisMonth', () => {
    it('should return daily essay count for the current month', async () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

      mockEssayRepository.countEssaysByDailyThisMonth.mockResolvedValue([]);
      mockUtilsService.formatDailyData.mockResolvedValue([]);

      const result = await adminService.countEssaysByDailyThisMonth(year, month + 1);

      expect(mockEssayRepository.countEssaysByDailyThisMonth).toHaveBeenCalledWith(
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(mockUtilsService.formatDailyData).toHaveBeenCalledWith(
        [],
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(result).toEqual([]);
    });
  });

  describe('countEssaysByMonthlyThisYear', () => {
    it('should return monthly essay count for the current year', async () => {
      const year = new Date().getUTCFullYear();

      mockEssayRepository.countEssaysByMonthlyThisYear.mockResolvedValue([]);
      mockUtilsService.formatMonthlyData.mockResolvedValue([]);

      const result = await adminService.countEssaysByMonthlyThisYear(year);

      expect(mockEssayRepository.countEssaysByMonthlyThisYear).toHaveBeenCalledWith(year);
      expect(mockUtilsService.formatMonthlyData).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('countDailyRegistrations', () => {
    it('should return daily registrations count for the current month', async () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

      mockUserRepository.countDailyRegistrations.mockResolvedValue([]);
      mockUtilsService.formatDailyData.mockResolvedValue([]);

      const result = await adminService.countDailyRegistrations(year, month + 1);

      expect(mockUserRepository.countDailyRegistrations).toHaveBeenCalledWith(
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(mockUtilsService.formatDailyData).toHaveBeenCalledWith(
        [],
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(result).toEqual([]);
    });
  });

  describe('countMonthlyRegistrations', () => {
    it('should return monthly registrations count for the current year', async () => {
      const year = new Date().getUTCFullYear();

      mockUserRepository.countMonthlyRegistrations.mockResolvedValue([]);
      mockUtilsService.formatMonthlyData.mockResolvedValue([]);

      const result = await adminService.countMonthlyRegistrations(year);

      expect(mockUserRepository.countMonthlyRegistrations).toHaveBeenCalledWith(year);
      expect(mockUtilsService.formatMonthlyData).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('countMonthlySubscriptionPayments', () => {
    it('should return monthly subscription payments count for the current month', async () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

      mockAdminRepository.countMonthlySubscriptionPayments.mockResolvedValue([]);
      mockUtilsService.formatDailyData.mockResolvedValue([]);

      const result = await adminService.countMonthlySubscriptionPayments(year, month + 1);

      expect(mockAdminRepository.countMonthlySubscriptionPayments).toHaveBeenCalledWith(
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(mockUtilsService.formatDailyData).toHaveBeenCalledWith(
        [],
        firstDayOfMonth,
        lastDayOfMonth,
      );
      expect(result).toEqual([]);
    });
  });

  describe('countYearlySubscriptionPayments', () => {
    it('should return yearly subscription payments count for the current year', async () => {
      const year = new Date().getUTCFullYear();

      mockAdminRepository.countYearlySubscriptionPayments.mockResolvedValue([]);
      mockUtilsService.formatMonthlyData.mockResolvedValue([]);

      const result = await adminService.countYearlySubscriptionPayments(year);

      expect(mockAdminRepository.countYearlySubscriptionPayments).toHaveBeenCalledWith(year);
      expect(mockUtilsService.formatMonthlyData).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('getReports', () => {
    it('리포트 리스트', async () => {
      const sort = 'date';
      const page = 1;
      const limit = 10;
      const reports = [];
      const totalReports = 0;
      const totalEssay = 0;

      mockUtilsService.transformToDto.mockReturnValue(reports);
      mockAdminRepository.getReports.mockResolvedValue({ reports, totalReports, totalEssay });

      const result = await adminService.getReports(sort, page, limit);

      expect(mockAdminRepository.getReports).toHaveBeenCalledWith(sort, page, limit);
      expect(result).toEqual({
        reports,
        totalReports,
        totalEssay,
        totalPage: 0,
        page,
      });
    });
  });

  describe('getReportDetails', () => {
    it('리포트 디테일', async () => {
      const essayId = 1;
      const essayWithReports = {
        author: { id: 1 },
        reports: [
          {
            id: 1,
            reason: 'spam',
            processed: false,
            processedDate: null,
            createdDate: new Date(),
            reporter: { id: 2 },
          },
        ],
      };

      mockEssayRepository.getReportDetails.mockResolvedValue(essayWithReports);
      mockUtilsService.transformToDto.mockResolvedValue({
        authorId: 1,
        reports: [
          {
            id: 1,
            reason: 'spam',
            processed: false,
            processedDate: null,
            createdDate: expect.any(Date),
            reporterId: 2,
          },
        ],
      });

      const result = await adminService.getReportDetails(essayId);

      expect(mockEssayRepository.getReportDetails).toHaveBeenCalledWith(essayId);
      expect(result).toEqual({
        authorId: 1,
        reports: [
          {
            id: 1,
            reason: 'spam',
            processed: false,
            processedDate: null,
            createdDate: expect.any(Date),
            reporterId: 2,
          },
        ],
      });
    });
  });

  describe('processReports', () => {
    it('리포트 처리', async () => {
      const userId = 1;
      const essayId = 1;
      const data: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'This is approved' };
      const essay = { id: 1, status: EssayStatus.PUBLISHED };

      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockAdminRepository.findReportByEssayId.mockResolvedValue([{ id: 1 }]);
      mockEssayRepository.saveEssay.mockResolvedValue(essay);
      mockAdminRepository.saveReport.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.processReports(userId, essayId, data);

      expect(mockEssayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(mockEssayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({ status: EssayStatus.PRIVATE }),
      );
      expect(mockAdminRepository.findReportByEssayId).toHaveBeenCalledWith(essayId);
      expect(mockAdminRepository.saveReport).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });

    it('리포트를 처리중 타겟 에세이를 찾을 수 없는 경우', async () => {
      const userId = 1;
      const essayId = 1;
      const data: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'This is approved' };

      mockEssayRepository.findEssayById.mockResolvedValue(null);

      await expect(adminService.processReports(userId, essayId, data)).rejects.toThrow(
        new HttpException('No essay found.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('syncReportsProcessed', () => {
    it('타겟 에세이에 대한 모든 리포트 동기화 처리', async () => {
      const essayId = 1;
      const userId = 1;
      const data: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'This is approved' };
      const reports = [{ id: 1 }];

      mockAdminRepository.findReportByEssayId.mockResolvedValue(reports);
      mockAdminRepository.saveReport.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.syncReportsProcessed(essayId, userId, data);

      expect(mockAdminRepository.findReportByEssayId).toHaveBeenCalledWith(essayId);
      expect(mockAdminRepository.saveReport).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });

    it('동기화 처리중 리포트가 없는 경우', async () => {
      const essayId = 1;
      const userId = 1;
      const data: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'This is approved' };

      mockAdminRepository.findReportByEssayId.mockResolvedValue([]);

      await expect(adminService.syncReportsProcessed(essayId, userId, data)).rejects.toThrow(
        new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getReviews', () => {
    it('대기중인 리뷰 조회', async () => {
      const page = 1;
      const limit = 10;
      const reviews = [];
      const total = 0;

      mockUtilsService.transformToDto.mockReturnValue(reviews);
      mockAdminRepository.getReviews.mockResolvedValue({ reviews, total });

      const result = await adminService.getReviews(page, limit);

      expect(mockAdminRepository.getReviews).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual({
        reviews: [],
        totalPage: 0,
        page,
        total,
      });
    });
  });

  describe('detailReview', () => {
    it('리뷰 상세 조회', async () => {
      const reviewId = 1;
      const review = { id: reviewId, type: 'published', essay: { id: 1, title: 'Test Essay' } };

      mockUtilsService.transformToDto.mockReturnValue(review);
      mockAdminRepository.getReview.mockResolvedValue(review);

      const result = await adminService.detailReview(reviewId);

      expect(mockAdminRepository.getReview).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(expect.objectContaining({ id: reviewId }));
    });
  });

  describe('processReview', () => {
    it('리뷰 처리', async () => {
      const userId = 1;
      const reviewId = 1;
      const data: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'This is approved' };
      const review = {
        id: reviewId,
        type: 'published',
        essay: { id: 1, status: EssayStatus.PRIVATE },
      };

      mockAdminRepository.getReview.mockResolvedValue(review);
      mockEssayRepository.saveEssay.mockResolvedValue(review.essay);
      mockAdminRepository.saveReview.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.processReview(userId, reviewId, data);

      expect(mockAdminRepository.getReview).toHaveBeenCalledWith(reviewId);
      expect(mockEssayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({ status: EssayStatus.PUBLISHED }),
      );
      expect(mockAdminRepository.saveReview).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('관리자용 유저 리스트', async () => {
      const filter = 'all';
      const page = 1;
      const limit = 10;
      const users = {};
      const total = 0;

      mockUserRepository.findUsers.mockResolvedValue({ users, total });
      mockUtilsService.transformToDto.mockReturnValue({
        users: [],
      });

      const result = await adminService.getUsers(filter, page, limit);

      expect(mockUserRepository.findUsers).toHaveBeenCalledWith(
        expect.any(Date),
        filter,
        page,
        limit,
      );
    });
  });

  describe('getUser', () => {
    it('관리자용 유저 디테일', async () => {
      const userId = 1;
      const user = {
        id: userId,
        reports: [],
        essays: [],
        reviews: [],
      };

      mockUtilsService.transformToDto.mockReturnValue(user);
      mockUserRepository.findUserDetailById.mockResolvedValue(user);

      const result = await adminService.getUser(userId);

      expect(mockUserRepository.findUserDetailById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expect.objectContaining({ id: userId }));
    });
  });

  describe('updateUser', () => {
    it('관리자용 유저 수정', async () => {
      const adminId = 1;
      const userId = 1;
      const data: UpdateFullUserReqDto = { status: UserStatus.BANNED };
      const updatedUser = { id: userId, ...data, reports: [], essays: [], reviews: [] };

      mockUserService.updateUser.mockResolvedValue(updatedUser);
      mockUserRepository.findUserById.mockResolvedValue(true);
      mockUserRepository.findUserDetailById.mockResolvedValue(updatedUser);

      const result = await adminService.updateUser(adminId, userId, data);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(userId, data);
      expect(mockUserRepository.findUserDetailById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(
        expect.objectContaining({ id: 1, reports: [], essays: [], reviews: [] }),
      );
    });
  });

  describe('getFullEssays', () => {
    it('관리자용 에세이 리스트 조회', async () => {
      const page = 1;
      const limit = 10;
      const essays = [];
      const total = 0;

      mockUtilsService.transformToDto.mockReturnValue(essays);
      mockEssayRepository.findFullEssays.mockResolvedValue({ essays, total });

      const result = await adminService.getFullEssays(page, limit);

      expect(mockEssayRepository.findFullEssays).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual({
        essays: [],
        totalPage: 0,
        page,
        total,
      });
    });
  });

  describe('getFullEssay', () => {
    it('관리자용 에세이 상세 조회', async () => {
      const essayId = 1;
      const essay = { id: 1 };

      mockUtilsService.transformToDto.mockReturnValue(essay);
      mockEssayRepository.findFullEssay.mockResolvedValue(essay);

      const result = await adminService.getFullEssay(essayId);
      expect(mockEssayRepository.findFullEssay).toHaveBeenCalledWith(essayId);
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
    });
  });

  describe('updateEssayStatus', () => {
    it('관리자용 에세이 상태 수정', async () => {
      const adminId = 1;
      const essayId = 1;
      const data: UpdateEssayStatusReqDto = { status: EssayStatus.PUBLISHED };
      const processData: ProcessReqDto = { actionType: ActionType.PENDING };

      const existingEssay = {
        id: essayId,
        status: EssayStatus.PRIVATE,
        reviews: [],
        reports: [],
      };

      const updatedEssay = {
        ...existingEssay,
        status: EssayStatus.PUBLISHED,
      };

      const newHistory = {
        id: 1,
        actionType: 'update',
        entityType: 'essay',
        entityId: essayId,
        processor: adminId,
        processedDate: new Date(),
      };

      mockEssayRepository.findFullEssay.mockResolvedValue(existingEssay);
      mockAdminRepository.saveHistory.mockResolvedValue(newHistory);
      mockEssayRepository.updateEssay.mockResolvedValue(updatedEssay);
      mockUtilsService.transformToDto.mockReturnValue(updatedEssay);

      const result = await adminService.updateEssayStatus(adminId, essayId, data);

      expect(mockEssayRepository.findFullEssay).toHaveBeenCalledWith(essayId);
      expect(mockEssayRepository.updateEssay).toHaveBeenCalledWith(
        existingEssay,
        expect.objectContaining({
          status: data.status,
        }),
      );
      expect(result).toEqual(updatedEssay);
    });
  });

  describe('getHistories', () => {
    it('관리자용 처리내역 리스트', async () => {
      const page = 1;
      const limit = 10;
      const histories = [];
      const total = 0;
      const action = '';
      const target = '';

      const expectedArgs = {
        order: { processedDate: 'DESC' },
        relations: ['report', 'review', 'user', 'essay'],
        skip: 0,
        take: limit,
        where: {},
      };

      mockUtilsService.transformToDto.mockReturnValue(histories);
      mockAdminRepository.getHistories.mockResolvedValue({ histories, total });

      const result = await adminService.getHistories(page, limit, target, action);

      expect(mockAdminRepository.getHistories).toHaveBeenCalledWith(expectedArgs);
      expect(result).toEqual({
        histories: [],
        totalPage: 0,
        page,
        total,
      });
    });
  });
});
