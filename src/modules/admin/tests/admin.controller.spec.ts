import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminRegisterReqDto } from '../dto/request/adminRegisterReq.dto';
import { AdminUpdateReqDto } from '../dto/request/adminUpdateReq.dto';
import { CreateAdminReqDto } from '../dto/request/createAdminReq.dto';
import { ProcessReqDto } from '../dto/request/processReq.dto';
import { UpdateEssayStatusReqDto } from '../dto/request/updateEssayStatusReq.dto';
import { UpdateFullUserReqDto } from '../dto/request/updateFullUserReq.dto';
import { CreateNoticeReqDto } from '../dto/request/createNoticeReq.dto';
import { UpdateNoticeReqDto } from '../dto/request/updateNoticeReq.dto';
import { InquiryAnswerReqDto } from '../dto/request/inquiryAnswerReq.dto';
import { UpdateReleaseReqDto } from '../dto/request/updateReleaseReq.dto';
import { Request as ExpressRequest } from 'express';
import { ActionType, EssayStatus, UserStatus } from '../../../common/types/enum.types';
import {
  AdminAuthController,
  AdminDashboardController,
  AdminInfoController,
  AdminManagementController,
  AdminOfficeController,
  AdminRootController,
  AdminSupportController,
  AdminTaskController,
} from '../admin.controller';

jest.mock('../admin.service');

describe('AdminController', () => {
  let adminAuthController: AdminAuthController;
  let adminInfoController: AdminInfoController;
  let adminDashboardController: AdminDashboardController;
  let adminTaskController: AdminTaskController;
  let adminManagementController: AdminManagementController;
  let adminSupportController: AdminSupportController;
  let adminOfficeController: AdminOfficeController;
  let adminRootController: AdminRootController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [
        AdminAuthController,
        AdminInfoController,
        AdminDashboardController,
        AdminTaskController,
        AdminManagementController,
        AdminSupportController,
        AdminOfficeController,
        AdminRootController,
      ],
      providers: [AdminService],
    })
      .overrideGuard(AuthGuard('admin-local'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AuthGuard('admin-jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    adminAuthController = module.get<AdminAuthController>(AdminAuthController);
    adminInfoController = module.get<AdminInfoController>(AdminInfoController);
    adminDashboardController = module.get<AdminDashboardController>(AdminDashboardController);
    adminTaskController = module.get<AdminTaskController>(AdminTaskController);
    adminManagementController = module.get<AdminManagementController>(AdminManagementController);
    adminSupportController = module.get<AdminSupportController>(AdminSupportController);
    adminOfficeController = module.get<AdminOfficeController>(AdminOfficeController);
    adminRootController = module.get<AdminRootController>(AdminRootController);

    service = module.get<AdminService>(AdminService) as jest.Mocked<AdminService>;
  });

  describe('register', () => {
    it('should call service register method', async () => {
      const dto: AdminRegisterReqDto = {
        email: 'test@example.com',
        password: '123456',
        name: 'Admin',
      };
      await adminAuthController.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('adminLogin', () => {
    it('should return undefined', async () => {
      const req = {
        user: { id: 1, email: 'test@example.com' },
        device: { os: 'os', type: 'type', model: 'model' },
      } as any;
      const result = await adminAuthController.adminLogin(req);
      expect(result).toBeUndefined();
    });
  });

  describe('updateAdmin', () => {
    it('should call service updateAdmin method', async () => {
      const dto: AdminUpdateReqDto = {
        password: '123456',
        info: 'info',
      };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminInfoController.updateAdmin(req, dto);
      expect(service.updateAdmin).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('saveProfileImage', () => {
    it('should call service saveProfileImage method', async () => {
      const file = { originalname: 'test.jpg', buffer: Buffer.from('test') } as Express.Multer.File;
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminInfoController.saveProfileImage(req, file);
      expect(service.saveProfileImage).toHaveBeenCalledWith(1, file);
    });
  });

  describe('deleteProfileImage', () => {
    it('should call service deleteProfileImage method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminInfoController.deleteProfileImage(req);
      expect(service.deleteProfileImage).toHaveBeenCalledWith(1);
    });
  });

  describe('getAdmins', () => {
    it('should call service getAdmins method', async () => {
      await adminInfoController.getAdmins(true);
      expect(service.getAdmins).toHaveBeenCalledWith(true);
    });
  });

  describe('createAdmin', () => {
    it('should call service createAdmin method', async () => {
      const dto: CreateAdminReqDto = {
        email: 'test@example.com',
        password: '123456',
      };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminRootController.createAdmin(req, dto);
      expect(service.createAdmin).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('dashboard', () => {
    it('should call service dashboard method', async () => {
      await adminDashboardController.dashboard();
      expect(service.dashboard).toHaveBeenCalled();
    });
  });

  describe('getDailyEssayCount', () => {
    it('should call service countEssaysByDailyThisMonth method', async () => {
      await adminDashboardController.getDailyEssayCount(2023, 7);
      expect(service.countEssaysByDailyThisMonth).toHaveBeenCalledWith(2023, 7);
    });
  });

  describe('getMonthlyEssayCount', () => {
    it('should call service countEssaysByMonthlyThisYear method', async () => {
      await adminDashboardController.getMonthlyEssayCount(2023);
      expect(service.countEssaysByMonthlyThisYear).toHaveBeenCalledWith(2023);
    });
  });

  describe('getDailyRegistrations', () => {
    it('should call service countDailyRegistrations method', async () => {
      await adminDashboardController.getDailyRegistrations(2023, 7);
      expect(service.countDailyRegistrations).toHaveBeenCalledWith(2023, 7);
    });
  });

  describe('getMonthlyRegistrations', () => {
    it('should call service countMonthlyRegistrations method', async () => {
      await adminDashboardController.getMonthlyRegistrations(2023);
      expect(service.countMonthlyRegistrations).toHaveBeenCalledWith(2023);
    });
  });

  describe('getDailySubscriptionPayments', () => {
    it('should call service countMonthlySubscriptionPayments method', async () => {
      await adminDashboardController.getDailySubscriptionPayments(2023, 7);
      expect(service.countMonthlySubscriptionPayments).toHaveBeenCalledWith(2023, 7);
    });
  });

  describe('getMonthlySubscriptionPayments', () => {
    it('should call service countYearlySubscriptionPayments method', async () => {
      await adminDashboardController.getMonthlySubscriptionPayments(2023);
      expect(service.countYearlySubscriptionPayments).toHaveBeenCalledWith(2023);
    });
  });

  describe('getReports', () => {
    it('should call service getReports method', async () => {
      await adminTaskController.getReports('most', 1, 10);
      expect(service.getReports).toHaveBeenCalledWith('most', 1, 10);
    });
  });

  describe('getEssayReports', () => {
    it('should call service getReportDetails method', async () => {
      await adminTaskController.getEssayReports(1);
      expect(service.getReportDetails).toHaveBeenCalledWith(1);
    });
  });

  describe('processReports', () => {
    it('should call service processReports method', async () => {
      const dto: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'test' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminTaskController.processReports(req, 1, dto);
      expect(service.processReports).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('getReviews', () => {
    it('should call service getReviews method', async () => {
      await adminTaskController.getReviews(1, 10);
      expect(service.getReviews).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getReview', () => {
    it('should call service detailReview method', async () => {
      await adminTaskController.getReview(1);
      expect(service.detailReview).toHaveBeenCalledWith(1);
    });
  });

  describe('processReview', () => {
    it('should call service processReview method', async () => {
      const dto: ProcessReqDto = { actionType: ActionType.APPROVED, comment: 'test' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminTaskController.processReview(req, 1, dto);
      expect(service.processReview).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('getUsers', () => {
    it('should call service getUsers method', async () => {
      await adminManagementController.getUsers(1, 10, 'all');
      expect(service.getUsers).toHaveBeenCalledWith('all', 1, 10);
    });
  });

  describe('getUser', () => {
    it('should call service getUser method', async () => {
      await adminManagementController.getUser(1);
      expect(service.getUser).toHaveBeenCalledWith(1);
    });
  });

  describe('updateUser', () => {
    it('should call service updateUser method', async () => {
      const dto: UpdateFullUserReqDto = {
        email: 'test@example.com',
        status: UserStatus.ACTIVATED,
      };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminManagementController.updateUser(req, 1, dto);
      expect(service.updateUser).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('getEssays', () => {
    it('should call service getFullEssays method', async () => {
      await adminManagementController.getEssays(1, 10);
      expect(service.getFullEssays).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getEssay', () => {
    it('should call service getFullEssay method', async () => {
      await adminManagementController.getEssay(1);
      expect(service.getFullEssay).toHaveBeenCalledWith(1);
    });
  });

  describe('updateEssayStatus', () => {
    it('should call service updateEssayStatus method', async () => {
      const dto: UpdateEssayStatusReqDto = { status: EssayStatus.PUBLISHED };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminManagementController.updateEssayStatus(req, 1, dto);
      expect(service.updateEssayStatus).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('getHistories', () => {
    it('should call service getHistories method', async () => {
      await adminOfficeController.getHistories(1, 10, 'report', 'approved');
      expect(service.getHistories).toHaveBeenCalledWith(1, 10, 'report', 'approved');
    });
  });

  describe('getInactiveAdmins', () => {
    it('should call service getInactiveAdmins method', async () => {
      await adminInfoController.getInactiveAdmins();
      expect(service.getInactiveAdmins).toHaveBeenCalled();
    });
  });

  describe('createNotice', () => {
    it('should call service createNotice method', async () => {
      const dto: CreateNoticeReqDto = { title: 'test', content: 'test content' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminSupportController.createNotice(req, dto);
      expect(service.createNotice).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateNotice', () => {
    it('should call service updateNotice method', async () => {
      const dto: UpdateNoticeReqDto = { title: 'updated', content: 'updated content' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminSupportController.updateNotice(req, 1, dto);
      expect(service.updateNotice).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('deleteNotice', () => {
    it('should call service deleteNotice method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminSupportController.deleteNotice(req, 1);
      expect(service.deleteNotice).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('getNotices', () => {
    it('should call service getNotices method', async () => {
      await adminSupportController.getNotices(1, 10);
      expect(service.getNotices).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getNotice', () => {
    it('should call service getNotice method', async () => {
      await adminSupportController.getNotice(1);
      expect(service.getNotice).toHaveBeenCalledWith(1);
    });
  });

  describe('getInquiries', () => {
    it('should call service getInquiries method', async () => {
      await adminSupportController.getInquiries(1, 10, 'all');
      expect(service.getInquiries).toHaveBeenCalledWith(1, 10, 'all');
    });
  });

  describe('getInquiry', () => {
    it('should call service getInquiry method', async () => {
      await adminSupportController.getInquiry(1);
      expect(service.getInquiry).toHaveBeenCalledWith(1);
    });
  });

  describe('createAnswer', () => {
    it('should call service createAnswer method', async () => {
      const dto: InquiryAnswerReqDto = { answer: 'answer' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminSupportController.createAnswer(req, 1, dto);
      expect(service.createAnswer).toHaveBeenCalledWith(1, 1, dto.answer);
    });
  });

  describe('createUpdateHistory', () => {
    it('should call service createUpdateHistory method', async () => {
      const dto: UpdateReleaseReqDto = { content: 'history' };
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminSupportController.createRelease(req, dto);
      expect(service.createRelease).toHaveBeenCalledWith(1, dto.content);
    });
  });

  describe('getAllUpdateHistories', () => {
    it('should call service getAllUpdateHistories method', async () => {
      await adminSupportController.getReleases(1, 10);
      expect(service.getReleases).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getUpdateHistory', () => {
    it('should call service getUpdateHistory method', async () => {
      await adminSupportController.getRelease(1);
      expect(service.getRelease).toHaveBeenCalledWith(1);
    });
  });

  describe('activationSettings', () => {
    it('should call service activationSettings method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      await adminRootController.activationSettings(req, 1, true);
      expect(service.activationSettings).toHaveBeenCalledWith(1, 1, true);
    });
  });

  describe('getAdmin', () => {
    it('should call service getAdmin method', async () => {
      await adminInfoController.getAdmin(1);
      expect(service.getAdmin).toHaveBeenCalledWith(1);
    });
  });
});
