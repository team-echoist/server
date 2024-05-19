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

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

describe('AdminService', () => {
  let adminService: AdminService;
  let mailService: any;

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
    mailService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AdminRepository, useValue: mockAdminRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: EssayRepository, useValue: mockEssayRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: UtilsService, useValue: mockUtilsService },
        { provide: MailService, useValue: mailService },
        { provide: AuthRepository, useValue: mockAuthRepository },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
  });

  describe('createAdmin', () => {
    it('사용자가 인증되지 않은 경우 오류가 발생', async () => {
      const createAdminDto: CreateAdminReqDto = { email: 'test@test.com', password: 'password' };
      await expect(adminService.createAdmin(2, createAdminDto)).rejects.toThrow(
        new HttpException('You are not authorized.', HttpStatus.FORBIDDEN),
      );
    });

    it('관리자 생성 성공', async () => {
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
    it('대시보드 데이터 조회', async () => {
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
    it('이번 달 일일 에세이 작성 카운트 조회', async () => {
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
    it('현재 연도 월별 에세이 작성 카운트 조회', async () => {
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
    it('이번 달 일일 가입자 카운트 조회', async () => {
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
    it('현재 연도의 월별 가입자 카운트 조회', async () => {
      const year = new Date().getUTCFullYear();

      mockUserRepository.countMonthlyRegistrations.mockResolvedValue([]);
      mockUtilsService.formatMonthlyData.mockResolvedValue([]);

      const result = await adminService.countMonthlyRegistrations(year);

      expect(mockUserRepository.countMonthlyRegistrations).toHaveBeenCalledWith(year);
      expect(mockUtilsService.formatMonthlyData).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('월간 구독 결제 카운트 조회', () => {
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
    it('연간 구독 결제 카운트 조회', async () => {
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
    it('신고 내역 리스트 조회', async () => {
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
    it('리포트 상세 조회', async () => {
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
      const data: ProcessReqDto = { actionType: 'approved', comment: 'This is approved' };
      const essay = { id: 1, published: true, linkedOut: true };

      mockEssayRepository.findEssayById.mockResolvedValue(essay);
      mockAdminRepository.findReportByEssayId.mockResolvedValue([{ id: 1 }]);
      mockEssayRepository.saveEssay.mockResolvedValue(essay);
      mockAdminRepository.saveReport.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.processReports(userId, essayId, data);

      expect(mockEssayRepository.findEssayById).toHaveBeenCalledWith(essayId);
      expect(mockEssayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          published: false,
          linkedOut: false,
        }),
      );
      expect(mockAdminRepository.findReportByEssayId).toHaveBeenCalledWith(essayId);
      expect(mockAdminRepository.saveReport).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });

    it('리포트 처리중 해당 에세이를 찾지 못한 경우 에러 발생', async () => {
      const userId = 1;
      const essayId = 1;
      const data: ProcessReqDto = { actionType: 'approved', comment: 'This is approved' };

      mockEssayRepository.findEssayById.mockResolvedValue(null);

      await expect(adminService.processReports(userId, essayId, data)).rejects.toThrow(
        new HttpException('No essay found.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('syncReportsProcessed', () => {
    it('에세이에 할당된 모든 신고 동기화 처리', async () => {
      const essayId = 1;
      const userId = 1;
      const data: ProcessReqDto = { actionType: 'approved', comment: 'This is approved' };
      const reports = [{ id: 1 }];

      mockAdminRepository.findReportByEssayId.mockResolvedValue(reports);
      mockAdminRepository.saveReport.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.syncReportsProcessed(essayId, userId, data);

      expect(mockAdminRepository.findReportByEssayId).toHaveBeenCalledWith(essayId);
      expect(mockAdminRepository.saveReport).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });

    it('에세이에 할당된 신고 동기화 처리중 에세이를 찾지 못하면 에러 발생', async () => {
      const essayId = 1;
      const userId = 1;
      const data: ProcessReqDto = { actionType: 'approved', comment: 'This is approved' };

      mockAdminRepository.findReportByEssayId.mockResolvedValue([]);

      await expect(adminService.syncReportsProcessed(essayId, userId, data)).rejects.toThrow(
        new HttpException('No reports found for this essay.', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getReviews', () => {
    it('대기중인 리뷰 리스트 조회', async () => {
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
      const data: ProcessReqDto = { actionType: 'approved', comment: 'This is approved' };
      const review = { id: reviewId, type: 'published', essay: { id: 1, published: false } };

      mockAdminRepository.getReview.mockResolvedValue(review);
      mockEssayRepository.saveEssay.mockResolvedValue(review.essay);
      mockAdminRepository.saveReview.mockResolvedValue({});
      mockAdminRepository.saveHistory.mockResolvedValue({});

      await adminService.processReview(userId, reviewId, data);

      expect(mockAdminRepository.getReview).toHaveBeenCalledWith(reviewId);
      expect(mockEssayRepository.saveEssay).toHaveBeenCalledWith(
        expect.objectContaining({
          published: true,
        }),
      );
      expect(mockAdminRepository.saveReview).toHaveBeenCalled();
      expect(mockAdminRepository.saveHistory).toHaveBeenCalled();
    });
  });

  describe('getHistories', () => {
    it('처리 내역 리스트 조회', async () => {
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

  describe('getUsers', () => {
    it('유저 리스트 조회', async () => {
      const filter = 'all';
      const page = 1;
      const limit = 10;
      const users = [];
      const total = 0;

      mockUserRepository.findUsers.mockResolvedValue({ users, total });

      const result = await adminService.getUsers(filter, page, limit);

      expect(mockUserRepository.findUsers).toHaveBeenCalledWith(
        expect.any(Date),
        filter,
        page,
        limit,
      );
      expect(result).toEqual({
        users: [],
        totalPage: 0,
        page,
        total,
      });
    });
  });

  describe('getUser', () => {
    it('유저 상세정보 조회', async () => {
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
    it('유저 정보 강제 업데이트', async () => {
      const adminId = 1;
      const userId = 1;
      const data: UpdateFullUserReqDto = { nickname: 'updatedUser' };
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
    it('에세이 리스트 조회', async () => {
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
    it('에세이 조회(검색)', async () => {
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
    it('에세이 강제 업데이트', async () => {
      const adminId = 1;
      const essayId = 1;
      const data = { published: false };
      const processData = { actionType: 'pending' };

      const existingEssay = {
        id: essayId,
        author: {},
        published: true,
        linkedOut: false,
      };

      const updatedEssay = {
        ...existingEssay,
        published: false,
      };

      const newHistory = {
        id: 1,
        actionType: 'update',
        entityType: 'essay',
        entityId: essayId,
        adminId: adminId,
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
          published: data.published,
        }),
      );
      expect(result).toEqual(updatedEssay);
    });
  });
});
