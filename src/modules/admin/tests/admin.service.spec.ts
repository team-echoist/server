import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';
import { UserRepository } from '../../user/user.repository';
import { EssayRepository } from '../../essay/essay.repository';
import { UserService } from '../../user/user.service';
import { MailService } from '../../mail/mail.service';
import { UtilsService } from '../../utils/utils.service';
import { AwsService } from '../../aws/aws.service';
import { SupportService } from '../../support/support.service';
import { SupportRepository } from '../../support/support.repository';
import { AlertService } from '../../alert/alert.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminReqDto } from '../dto/request/createAdminReq.dto';
import { CreateAdminDto } from '../dto/createAdmin.dto';
import { AdminUpdateReqDto } from '../dto/request/adminUpdateReq.dto';
import { AdminResDto } from '../dto/response/adminRes.dto';
import { GeulroquisService } from '../../geulroquis/geulroquis.service';
import { CronService } from '../../cron/cron.service';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('bull');
jest.mock('../admin.repository');
jest.mock('../../user/user.service');
jest.mock('../../user/user.repository');
jest.mock('../../essay/essay.repository');
jest.mock('../../support/support.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../aws/aws.service');
jest.mock('../../mail/mail.service');
jest.mock('../../support/support.service');
jest.mock('../../alert/alert.service');
jest.mock('../../fcm/fcm.service');
jest.mock('../../geulroquis/geulroquis.service');
jest.mock('../../cron/cron.service');

describe('AdminService', () => {
  let service: AdminService;
  let adminRepository: jest.Mocked<AdminRepository>;
  let userService: jest.Mocked<UserService>;
  let userRepository: jest.Mocked<UserRepository>;
  let essayRepository: jest.Mocked<EssayRepository>;
  let supportRepository: jest.Mocked<SupportRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let awsService: jest.Mocked<AwsService>;
  let mailService: jest.Mocked<MailService>;
  let supportService: jest.Mocked<SupportService>;
  let alertService: jest.Mocked<AlertService>;
  let geulroquisService: jest.Mocked<GeulroquisService>;
  let cronService: jest.Mocked<CronService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        AdminRepository,
        UserService,
        UserRepository,
        EssayRepository,
        MailService,
        UtilsService,
        AwsService,
        SupportService,
        SupportRepository,
        AlertService,
        GeulroquisService,
        CronService,
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
        {
          provide: 'BullQueue_admin',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    adminRepository = module.get(AdminRepository);
    userRepository = module.get(UserRepository);
    essayRepository = module.get(EssayRepository);
    utilsService = module.get(UtilsService);
    essayRepository = module.get(EssayRepository);
    supportRepository = module.get(SupportRepository);
    awsService = module.get(AwsService);
    mailService = module.get(MailService);
    supportService = module.get(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dashboard', () => {
    it('should return dashboard data', async () => {
      const mockData = {
        totalUser: 100,
        currentSubscriber: 50,
        todaySubscribers: 5,
        totalEssays: 200,
        todayEssays: 10,
        publishedEssays: 150,
        linkedOutEssays: 30,
        unprocessedReports: 10,
        unprocessedReviews: 5,
      };

      userRepository.usersCount.mockResolvedValue(mockData.totalUser);
      adminRepository.totalSubscriberCount.mockResolvedValue(mockData.currentSubscriber);
      adminRepository.todaySubscribers.mockResolvedValue(mockData.todaySubscribers);
      essayRepository.totalEssayCount.mockResolvedValue(mockData.totalEssays);
      essayRepository.todayEssays.mockResolvedValue(mockData.todayEssays);
      essayRepository.totalPublishedEssays.mockResolvedValue(mockData.publishedEssays);
      essayRepository.totalLinkedOutEssays.mockResolvedValue(mockData.linkedOutEssays);
      adminRepository.unprocessedReports.mockResolvedValue(mockData.unprocessedReports);
      adminRepository.unprocessedReviews.mockResolvedValue(mockData.unprocessedReviews);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.dashboard();
      expect(result).toEqual(mockData);
    });
  });

  describe('createAdmin', () => {
    it('should create a new admin', async () => {
      const adminId = 1;
      const createAdminReqDto: CreateAdminReqDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const hashedPassword = await bcrypt.hash(createAdminReqDto.password, 10);
      const createAdminDto: CreateAdminDto = {
        ...createAdminReqDto,
        password: hashedPassword,
        activated: true,
      };

      adminRepository.saveAdmin.mockResolvedValue(createAdminDto as any);
      utilsService.transformToDto.mockImplementation((_dto, obj) => obj);

      const result = await service.createAdmin(adminId, createAdminReqDto);
      expect(result).toEqual(createAdminDto);
    });

    it('should throw an error if the admin is not authorized', async () => {
      const adminId = 2;
      const createAdminReqDto: CreateAdminReqDto = {
        email: 'test@example.com',
        password: 'password',
      };

      await expect(service.createAdmin(adminId, createAdminReqDto)).rejects.toThrowError(
        'You are not authorized.',
      );
    });
  });

  describe('countEssaysByDailyThisMonth', () => {
    it('should return daily essay count for the month', async () => {
      const mockData = [{ date: '2021-01-01', count: 5 }];
      essayRepository.countEssaysByDailyThisMonth.mockResolvedValue(mockData);
      utilsService.formatDailyData.mockResolvedValue(mockData as any);

      const result = await service.countEssaysByDailyThisMonth(2021, 1);
      expect(result).toEqual(mockData);
    });
  });

  describe('countEssaysByMonthlyThisYear', () => {
    it('should return monthly essay count for the year', async () => {
      const mockData = [{ month: '2021-01', count: 50 }];
      essayRepository.countEssaysByMonthlyThisYear.mockResolvedValue(mockData);
      utilsService.formatMonthlyData.mockResolvedValue(mockData as any);

      const result = await service.countEssaysByMonthlyThisYear(2021);
      expect(result).toEqual(mockData);
    });
  });

  describe('countDailyRegistrations', () => {
    it('should return daily registrations count for the month', async () => {
      const mockData = [{ date: '2021-01-01', count: 10 }];
      userRepository.countDailyRegistrations.mockResolvedValue(mockData);
      utilsService.formatDailyData.mockResolvedValue(mockData as any);

      const result = await service.countDailyRegistrations(2021, 1);
      expect(result).toEqual(mockData);
    });
  });

  describe('countMonthlyRegistrations', () => {
    it('should return monthly registrations count for the year', async () => {
      const mockData = [{ month: '2021-01', count: 100 }];
      userRepository.countMonthlyRegistrations.mockResolvedValue(mockData);
      utilsService.formatMonthlyData.mockResolvedValue(mockData as any);

      const result = await service.countMonthlyRegistrations(2021);
      expect(result).toEqual(mockData);
    });
  });

  describe('getAdmins', () => {
    it('should return a list of admins', async () => {
      const mockAdmins = [{ id: 1, email: 'admin@example.com' }];
      adminRepository.findAdmins.mockResolvedValue(mockAdmins as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getAdmins(true);
      expect(result).toEqual({ admins: mockAdmins });
    });
  });

  describe('getAdmin', () => {
    it('should return an admin by ID', async () => {
      const mockAdmin = { id: 1, email: 'admin@example.com' };
      adminRepository.findAdmin.mockResolvedValue(mockAdmin as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getAdmin(1);
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('updateAdmin', () => {
    it('should update an admin', async () => {
      const mockAdmin = { id: 1, email: 'admin@example.com', password: 'hashedPassword' };
      const adminUpdateReqDto: AdminUpdateReqDto = { password: 'newPassword' };
      const hashedPassword = await bcrypt.hash(adminUpdateReqDto.password, 10);
      const updatedAdmin = { ...mockAdmin, password: hashedPassword };

      adminRepository.findAdmin.mockResolvedValue(mockAdmin as any);
      adminRepository.updateAdmin.mockResolvedValue(updatedAdmin as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.updateAdmin(1, adminUpdateReqDto);
      expect(result).toEqual(updatedAdmin);
    });
  });

  describe('saveProfileImage', () => {
    it('should save profile image', async () => {
      const mockAdmin = { id: 1, profileImage: null };
      const mockFile = { originalname: 'test.png', buffer: Buffer.from('') } as any;
      const imageUrl = 'https://s3.amazonaws.com/profile/test.png';

      adminRepository.findAdmin.mockResolvedValue(mockAdmin as any);
      awsService.imageUploadToS3.mockResolvedValue(imageUrl);
      adminRepository.saveAdmin.mockResolvedValue({ ...mockAdmin, profileImage: imageUrl } as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.saveProfileImage(1, mockFile);
      expect(result).toEqual({ imageUrl });
    });
  });

  describe('deleteProfileImage', () => {
    it('should delete profile image', async () => {
      const mockAdmin = { id: 1, profileImage: 'https://s3.amazonaws.com/image.png' };

      adminRepository.findAdmin.mockResolvedValue(mockAdmin as any);
      adminRepository.saveAdmin.mockResolvedValue({ ...mockAdmin, profileImage: null } as any);

      const result = await service.deleteProfileImage(1);
      expect(result).toEqual({ message: 'Profile image deleted successfully' });
    });

    it('should throw an error if no profile image exists', async () => {
      const mockAdmin = { id: 1, profileImage: null };

      adminRepository.findAdmin.mockResolvedValue(mockAdmin as any);

      await expect(service.deleteProfileImage(1)).rejects.toThrowError(
        'No profile image to delete',
      );
    });
  });

  describe('register', () => {
    it('should register a new admin', async () => {
      const adminRegisterReqDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test Admin',
      };

      const hashedPassword = await bcrypt.hash(adminRegisterReqDto.password, 10);
      const createAdminDto = {
        ...adminRegisterReqDto,
        password: hashedPassword,
        activated: false,
      };

      adminRepository.saveAdmin.mockResolvedValue(createAdminDto as any);

      const result = await service.register(adminRegisterReqDto);
      expect(result).toEqual({ message: 'Wait for the root administrator to confirm.' });
    });

    it('should throw an error if email is already in use', async () => {
      const adminRegisterReqDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test Admin',
      };

      adminRepository.findByEmail.mockResolvedValue({ email: 'test@example.com' } as any);

      await expect(service.register(adminRegisterReqDto)).rejects.toThrowError(
        'Email already in use.',
      );
    });
  });

  describe('activationSettings', () => {
    it('should activate or deactivate an admin', async () => {
      const rootAdmin = { id: 1 };
      const targetAdmin = { id: 2, activated: false, email: 'admin@admin.com' };
      const updatedAdmin = { ...targetAdmin, activated: true };

      adminRepository.findAdmin.mockResolvedValueOnce(rootAdmin as any);
      adminRepository.findAdmin.mockResolvedValueOnce(targetAdmin as any);
      adminRepository.saveAdmin.mockResolvedValue(updatedAdmin as any);
      mailService.sendActiveComplete.mockResolvedValue();
      utilsService.transformToDto.mockReturnValue(updatedAdmin as AdminResDto);

      const result = await service.activationSettings(rootAdmin.id, targetAdmin.id, true);
      expect(result).toEqual(updatedAdmin);
      expect(mailService.sendActiveComplete).toHaveBeenCalledWith(targetAdmin.email);
    });

    it('should throw an error if not root admin', async () => {
      const nonRootAdmin = { id: 2 };

      adminRepository.findAdmin.mockResolvedValue(nonRootAdmin as any);

      await expect(service.activationSettings(nonRootAdmin.id, 2, true)).rejects.toThrowError(
        'Root administrator only',
      );
    });
  });

  describe('getInactiveAdmins', () => {
    it('should return a list of inactive admins', async () => {
      const mockAdmins = [{ id: 2, email: 'inactiveadmin@example.com', activated: false }];
      adminRepository.findAdmins.mockResolvedValue(mockAdmins as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getInactiveAdmins();
      expect(result).toEqual({ admins: mockAdmins });
    });
  });

  describe('createNotice', () => {
    it('should create a notice', async () => {
      const adminId = 1;
      const createNoticeReqDto = { title: 'Notice Title', content: 'Notice Content' };
      const processor = { id: 1, email: 'admin@example.com' };
      const newNotice = { id: 1, ...createNoticeReqDto, processor };
      const savedNotice = { ...newNotice };

      adminRepository.findAdmin.mockResolvedValue(processor as any);
      supportRepository.saveNotice.mockResolvedValue(savedNotice as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.createNotice(adminId, createNoticeReqDto);
      expect(result).toEqual(savedNotice);
    });
  });

  describe('updateNotice', () => {
    it('should update a notice', async () => {
      const adminId = 1;
      const noticeId = 1;
      const updateNoticeReqDto = { title: 'Updated Title', content: 'Updated Content' };
      const processor = { id: 1, email: 'admin@example.com' };
      const existingNotice = { id: 1, title: 'Old Title', content: 'Old Content', processor };
      const updatedNotice = { ...existingNotice, ...updateNoticeReqDto };

      adminRepository.findAdmin.mockResolvedValue(processor as any);
      supportRepository.findNotice.mockResolvedValue(existingNotice as any);
      supportRepository.saveNotice.mockResolvedValue(updatedNotice as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.updateNotice(adminId, noticeId, updateNoticeReqDto);
      expect(result).toEqual(updatedNotice);
    });
  });

  describe('deleteNotice', () => {
    it('should delete a notice', async () => {
      const adminId = 1;
      const noticeId = 1;
      const processor = { id: 1, email: 'admin@example.com' };
      const existingNotice = { id: 1, title: 'Title', content: 'Content', processor };

      adminRepository.findAdmin.mockResolvedValue(processor as any);
      supportRepository.findNotice.mockResolvedValue(existingNotice as any);

      await service.deleteNotice(adminId, noticeId);
      expect(supportRepository.saveNotice).toHaveBeenCalledWith({
        ...existingNotice,
        processor,
        deletedDate: expect.any(Date),
      });
    });
  });

  describe('getNotices', () => {
    it('should return notices', async () => {
      const mockNotices = { notices: [{ id: 1, title: 'Notice' }], total: 1, page: 1, limit: 10 };
      supportService.getNotices.mockResolvedValue(mockNotices as any);

      const result = await service.getNotices(1, 10);
      expect(result).toEqual(mockNotices);
    });
  });

  describe('getNotice', () => {
    it('should return a notice', async () => {
      const noticeId = 1;
      const mockNotice = { id: 1, title: 'Notice' };

      supportRepository.findNotice.mockResolvedValue(mockNotice as any);
      utilsService.transformToDto.mockImplementation((_dto, obj) => obj);

      const result = await service.getNotice(noticeId);
      expect(result).toEqual(mockNotice);
    });
  });

  describe('getInquiries', () => {
    it('should return inquiries', async () => {
      const mockInquiries = [{ id: 1, title: 'Inquiry' }];
      const expectedResponse = {
        inquiries: mockInquiries,
        page: 1,
        total: 1,
        totalPage: 1,
      };

      supportRepository.findAdminInquiries.mockResolvedValue({
        inquiries: mockInquiries,
        page: 1,
        total: 1,
        totalPage: 1,
      } as any);
      utilsService.transformToDto.mockImplementation((_dto, obj) => obj);

      const result = await service.getInquiries(1, 10, 'all');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getInquiry', () => {
    it('should return an inquiry', async () => {
      const inquiryId = 1;
      const mockInquiry = { id: 1, title: 'Inquiry' };

      supportRepository.findInquiryById.mockResolvedValue(mockInquiry as any);
      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getInquiry(inquiryId);
      expect(result).toEqual(mockInquiry);
    });
  });

  describe('createAnswer', () => {
    it('should create an answer for an inquiry', async () => {
      const adminId = 1;
      const inquiryId = 1;
      const answer = 'This is the answer';
      const processor = { id: 1, email: 'admin@example.com' };
      const inquiry = { id: 1, title: 'Inquiry', answer: null, processed: false, processor: null };

      adminRepository.findAdmin.mockResolvedValue(processor as any);
      supportRepository.findInquiryById.mockResolvedValue(inquiry as any);

      await service.createAnswer(adminId, inquiryId, answer);

      expect(supportRepository.saveInquiry).toHaveBeenCalledWith({
        ...inquiry,
        answer,
        processed: true,
      });
      expect(adminRepository.saveHistory).toHaveBeenCalled();
    });
  });

  describe('createUpdateHistory', () => {
    it('should create an update history', async () => {
      const adminId = 1;
      const history = 'Update history';
      const processor = { id: 1, email: 'admin@example.com' };
      const newUpdateHistory = { id: 1, history, processor };

      adminRepository.findAdmin.mockResolvedValue(processor as any);
      supportRepository.saveUpdateHistory.mockResolvedValue(newUpdateHistory as any);

      await service.createUpdateHistory(adminId, history);
      expect(supportRepository.saveUpdateHistory).toHaveBeenCalledWith(
        expect.objectContaining({ history }),
      );
    });
  });

  describe('getAllUpdateHistories', () => {
    it('should return update histories', async () => {
      const mockHistories = {
        histories: [{ id: 1, history: 'Update' }],
        total: 1,
        page: 1,
        totalPage: 1,
      };
      supportRepository.findAllUpdateHistories.mockResolvedValue(mockHistories as any);
      utilsService.transformToDto.mockImplementation((_dto, obj) => obj);

      const result = await service.getAllUpdateHistories(1, 10);
      expect(result).toEqual(mockHistories);
    });
  });

  describe('getUpdateHistory', () => {
    it('should return an update history', async () => {
      const historyId = 1;
      const mockHistory = { id: 1, history: 'Update' };

      supportRepository.findUpdatedHistory.mockResolvedValue(mockHistory as any);
      utilsService.transformToDto.mockImplementation((_dto, obj) => obj);

      const result = await service.getUpdateHistory(historyId);
      expect(result).toEqual(mockHistory);
    });
  });
});
