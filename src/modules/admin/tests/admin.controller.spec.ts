import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { CreateAdminReqDto } from '../dto/request/createAdminReq.dto';
import { ProcessReqDto } from '../dto/request/processReq.dto';
import { UpdateFullUserReqDto } from '../dto/request/updateFullUserReq.dto';
import { UpdateEssayStatusReqDto } from '../dto/request/updateEssayStatusReq.dto';
import { ActionType } from '../../../entities/processedHistory.entity';
import { EssayStatus } from '../../../entities/essay.entity';
import { setTestUserMiddleware } from '../../../common/utils';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return jest.fn().mockImplementation(() => {
      return { canActivate: () => true };
    });
  },
}));

describe('AdminController', () => {
  let app: INestApplication;
  const adminService = {
    createAdmin: jest.fn(),
    dashboard: jest.fn(),
    countEssaysByDailyThisMonth: jest.fn(),
    countEssaysByMonthlyThisYear: jest.fn(),
    countDailyRegistrations: jest.fn(),
    countMonthlyRegistrations: jest.fn(),
    countMonthlySubscriptionPayments: jest.fn(),
    countYearlySubscriptionPayments: jest.fn(),
    getReports: jest.fn(),
    getReportDetails: jest.fn(),
    processReports: jest.fn(),
    getReviews: jest.fn(),
    detailReview: jest.fn(),
    processReview: jest.fn(),
    getHistories: jest.fn(),
    getUsers: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    getFullEssays: jest.fn(),
    getFullEssay: jest.fn(),
    updateEssayStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(setTestUserMiddleware({ id: 1 }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('관리자 계정 생성', async () => {
    const createAdminDto: CreateAdminReqDto = { email: 'admin@test.com', password: 'password' };
    const expectedResponse = { id: 1, email: 'admin@test.com' };

    adminService.createAdmin.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .post('/admin')
      .send(createAdminDto)
      .expect(201)
      .expect(expectedResponse);
  });

  it('대시보드 조회', async () => {
    const expectedResponse = {
      totalUsers: 100,
      totalEssays: 200,
    };

    adminService.dashboard.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer()).get('/admin').expect(200).expect(expectedResponse);
  });

  it('월간 일별 에세이 카운트 조회', async () => {
    const expectedResponse = { '1': 126, '2': 89, '31': 150 };
    adminService.countEssaysByDailyThisMonth.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/essays/daily')
      .query({ year: 2022, month: 5 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('년간 월별 에세이 카운트 조회', async () => {
    const expectedResponse = { '1': 542, '2': 753, '12': 347 };
    adminService.countEssaysByMonthlyThisYear.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/essays/monthly')
      .query({ year: 2022 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('월간 일별 유입자 카운트 조회', async () => {
    const expectedResponse = { '1': 126, '2': 89, '31': 150 };
    adminService.countDailyRegistrations.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/users/daily')
      .query({ year: 2022, month: 5 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('년간 월별 유입자 카운트 조회', async () => {
    const expectedResponse = { '1': 542, '2': 753, '12': 347 };
    adminService.countMonthlyRegistrations.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/users/monthly')
      .query({ year: 2022 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('월간 일별 구독 결제 카운트 조회', async () => {
    const expectedResponse = { '1': 126, '2': 89, '31': 150 };
    adminService.countMonthlySubscriptionPayments.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/payments/daily')
      .query({ year: 2022, month: 5 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('년간 월별 구독 결제 카운트 조회', async () => {
    const expectedResponse = { '1': 542, '2': 753, '12': 347 };
    adminService.countYearlySubscriptionPayments.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/statistics/payments/monthly')
      .query({ year: 2022 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('리포트 리스트 조회', async () => {
    const expectedResponse = { reports: [], total: 0 };
    adminService.getReports.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/reports')
      .query({ sort: 'desc', page: 1, limit: 10 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('리포트 상세 조회', async () => {
    const expectedResponse = { id: 1, details: 'Report details' };
    adminService.getReportDetails.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer()).get('/admin/reports/1').expect(200).expect(expectedResponse);
  });

  it('리포트 처리', async () => {
    const processReqDto: ProcessReqDto = { actionType: ActionType.APPROVED };
    const expectedResponse = { message: 'Report processed' };

    adminService.processReports.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .post('/admin/reports/1')
      .send(processReqDto)
      .expect(201)
      .expect(expectedResponse);
  });

  it('대기중인 리뷰 리스트 조회', async () => {
    const expectedResponse = { reviews: [], total: 0 };
    adminService.getReviews.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/reviews')
      .query({ page: 1, limit: 10 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('리뷰 상세 조회', async () => {
    const expectedResponse = { id: 1, details: 'Review details' };
    adminService.detailReview.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer()).get('/admin/reviews/1').expect(200).expect(expectedResponse);
  });

  it('리뷰 처리', async () => {
    const processReqDto: ProcessReqDto = { actionType: ActionType.APPROVED };
    const expectedResponse = { message: 'Review processed' };

    adminService.processReview.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .post('/admin/review/1')
      .send(processReqDto)
      .expect(201)
      .expect(expectedResponse);
  });

  it('유저 리스트 조회', async () => {
    const expectedResponse = { users: [], total: 0 };
    adminService.getUsers.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/users')
      .query({ page: 1, limit: 10, filter: 'all' })
      .expect(200)
      .expect(expectedResponse);
  });

  it('유저 상세 조회', async () => {
    const expectedResponse = { id: 1, username: 'user' };
    adminService.getUser.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer()).get('/admin/users/1').expect(200).expect(expectedResponse);
  });

  it('유저 정보 강제 수정', async () => {
    const updateFullUserReqDto: UpdateFullUserReqDto = { nickname: 'updatedUser' };
    const expectedResponse = { id: 1, nickname: 'updatedUser' };

    adminService.updateUser.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .put('/admin/users/1')
      .send(updateFullUserReqDto)
      .expect(200)
      .expect(expectedResponse);
  });

  it('에세이 리스트 조회', async () => {
    const expectedResponse = { essays: [], total: 0 };
    adminService.getFullEssays.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/essays')
      .query({ page: 1, limit: 10 })
      .expect(200)
      .expect(expectedResponse);
  });

  it('에세이 상세 조회', async () => {
    const expectedResponse = { id: 1, title: 'Sample Essay' };
    adminService.getFullEssay.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer()).get('/admin/essays/1').expect(200).expect(expectedResponse);
  });

  it('에세이 상태 수정', async () => {
    const updateEssayStatusReqDto: UpdateEssayStatusReqDto = { status: EssayStatus.PRIVATE };
    const expectedResponse = { id: 1, status: 'private' };

    adminService.updateEssayStatus.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .put('/admin/essays/1')
      .send(updateEssayStatusReqDto)
      .expect(200)
      .expect(expectedResponse);
  });

  it('관리자 처리 기록 조회', async () => {
    const expectedResponse = { histories: [], total: 0 };
    adminService.getHistories.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .get('/admin/histories')
      .query({ page: 1, limit: 10, target: 'report', action: 'approved' })
      .expect(200)
      .expect(expectedResponse);
  });
});
