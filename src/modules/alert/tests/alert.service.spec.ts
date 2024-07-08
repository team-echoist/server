import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from '../alert.service';
import { AlertRepository } from '../alert.repository';
import { UtilsService } from '../../utils/utils.service';
import { SupportService } from '../../support/support.service';
import { FcmService } from '../../fcm/fcm.service';
import { UserService } from '../../user/user.service';
import { User } from '../../../entities/user.entity';
import { EssayStatus } from '../../../entities/essay.entity';
import { ActionType } from '../../../entities/processedHistory.entity';
import { AlertType } from '../../../entities/alert.entity';
import { HttpException } from '@nestjs/common';
import { NicknameService } from '../../nickname/nickname.service';
import { AwsService } from '../../aws/aws.service';
import { AuthService } from '../../auth/auth.service';
import { EssayService } from '../../essay/essay.service';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('bull');
jest.mock('../alert.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../support/support.service');
jest.mock('../../fcm/fcm.service');
jest.mock('../../user/user.service');
jest.mock('../../aws/aws.service');
jest.mock('../../nickname/nickname.service');
jest.mock('../../auth/auth.service');
jest.mock('../../essay/essay.service');

describe('AlertService', () => {
  let service: AlertService;
  let alertRepository: jest.Mocked<AlertRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let supportService: jest.Mocked<SupportService>;
  let fcmService: jest.Mocked<FcmService>;
  const userService = {
    fetchUserEntityById: jest.fn(),
  };

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
        AlertService,
        AlertRepository,
        UtilsService,
        SupportService,
        FcmService,
        { provide: UserService, useValue: userService },
        { provide: AwsService, useValue: {} },
        { provide: NicknameService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: EssayService, useValue: {} },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
        {
          provide: 'BullQueue_alert',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
    alertRepository = module.get(AlertRepository);
    utilsService = module.get(UtilsService);
    supportService = module.get(SupportService);
    fcmService = module.get(FcmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasUnreadAlerts', () => {
    it('should return true if there are unread alerts', async () => {
      alertRepository.countingAlert.mockResolvedValue(5);

      const result = await service.hasUnreadAlerts(1);
      expect(result).toBe(true);
    });

    it('should return false if there are no unread alerts', async () => {
      alertRepository.countingAlert.mockResolvedValue(0);

      const result = await service.hasUnreadAlerts(1);
      expect(result).toBe(false);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts with pagination info', async () => {
      const mockAlerts = [{ id: 1, type: AlertType.SUPPORT }];
      alertRepository.findAlerts.mockResolvedValue({ alerts: mockAlerts as any, total: 1 });

      utilsService.transformToDto.mockImplementation((dto, obj) => obj);

      const result = await service.getAlerts(1, 1, 10);
      expect(result).toEqual({
        alerts: mockAlerts,
        total: 1,
        page: 1,
        totalPage: 1,
      });
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark an alert as read', async () => {
      const mockAlert = { id: 1, read: false };
      alertRepository.findAlert.mockResolvedValue(mockAlert as any);
      alertRepository.saveAlert.mockResolvedValue({ ...mockAlert, read: true } as any);

      await service.markAlertAsRead(1, 1);
      expect(mockAlert.read).toBe(true);
      expect(alertRepository.saveAlert).toHaveBeenCalledWith(mockAlert);
    });

    it('should throw NotFoundException if alert not found', async () => {
      alertRepository.findAlert.mockResolvedValue(null);

      await expect(service.markAlertAsRead(1, 1)).rejects.toThrow(HttpException);
    });
  });

  describe('createAndSendReportProcessedAlerts', () => {
    it('should add job to alert queue', async () => {
      const reports = [{ id: 1 }] as any;
      const type = ActionType.APPROVED;

      await service.createAndSendReportProcessedAlerts(reports, type);
    });
  });

  describe('processReportAlerts', () => {
    it('should process report alerts and send push notifications', async () => {
      const reports = [{ id: 1, reporter: { id: 1 }, essay: { id: 1 } }] as any;
      const type = ActionType.APPROVED;
      const mockUser = { id: 1, deviceToken: 'token' } as any;
      const mockDevices = [{ deviceId: 'device1' }];
      const mockAlertSettings = { report: true };

      userService.fetchUserEntityById.mockResolvedValue(mockUser);
      supportService.getDevices.mockResolvedValue(mockDevices as any);
      supportService.fetchSettingEntityById.mockResolvedValue(mockAlertSettings as any);

      await service.processReportAlerts(reports, type);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(1);
      expect(supportService.getDevices).toHaveBeenCalledWith(1);
      expect(supportService.fetchSettingEntityById).toHaveBeenCalledWith(1, 'device1');
      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token',
        '신고 결과를 알려드릴려고 왔어요!',
        '요청하신 지원에 대한 업데이트가 있어요.',
      );
    });

    it('should not send push notifications if no devices found', async () => {
      const reports = [{ id: 1, reporter: { id: 1 }, essay: { id: 1 } }] as any;
      const type = ActionType.APPROVED;
      const mockUser = { id: 1, deviceToken: 'token' } as any;

      userService.fetchUserEntityById.mockResolvedValue(mockUser);
      supportService.getDevices.mockResolvedValue([]);

      await service.processReportAlerts(reports, type);

      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });

  describe('createReportProcessedAlert', () => {
    it('should create a report processed alert', async () => {
      const mockUser = { id: 1 } as User;
      const mockReport = {
        id: 1,
        createdDate: new Date(),
        essay: { status: EssayStatus.PUBLISHED },
      } as any;
      const type = ActionType.APPROVED;

      utilsService.formatDateToKorean.mockReturnValue('2024-01-01');
      alertRepository.saveAlert.mockResolvedValue({} as any);

      await service.createReportProcessedAlert(mockUser, mockReport, type);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          title: '2024-01-01에 요청하신 지원에 대한 내용이 업데이트 되었습니다.',
          content: '2024-01-01에 신고하신 게시물이 비공개 처리되었습니다.',
          body: expect.any(String),
          type: AlertType.SUPPORT,
        }),
      );
    });
  });

  describe('createReportResultAlerts', () => {
    it('should create report result alerts', async () => {
      const mockEssay = { id: 1, createdDate: new Date(), author: { id: 1 } } as any;
      const mockUser = { id: 1 } as User;

      utilsService.formatDateToKorean.mockReturnValue('2024-01-01');
      userService.fetchUserEntityById.mockResolvedValue(mockUser);
      alertRepository.saveAlert.mockResolvedValue({} as any);

      await service.createReportResultAlerts(mockEssay);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          title: '2024-01-01에 작성하신 게시물이 업데이트 됐어요.',
          content: '2024-01-01에 작성하신 게시물이 비공개 처리되었습니다.',
          body: expect.any(String),
          type: AlertType.SUPPORT,
        }),
      );
    });
  });

  describe('sendPushAlertReportProcessed', () => {
    it('should send push notifications for processed report alerts', async () => {
      const mockEssay = { id: 1, author: { id: 1 } } as any;
      const mockDevices = [{ deviceId: 'device1', deviceToken: 'token1' }];
      const mockAlertSettings = { report: true };

      supportService.getDevices.mockResolvedValue(mockDevices as any);
      supportService.fetchSettingEntityById.mockResolvedValue(mockAlertSettings as any);

      await service.sendPushAlertReportProcessed(mockEssay);

      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token1',
        '$작성하신 글에 대한 업데이트가 있어요.',
        '발행하신 글이 검토 후 비공개 상태로 전환됐어요.',
      );
    });

    it('should not send push notifications if no devices found', async () => {
      const mockEssay = { id: 1, author: { id: 1 } };

      supportService.getDevices.mockResolvedValue([]);

      await service.sendPushAlertReportProcessed(mockEssay as any);

      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });

  describe('createReviewAlerts', () => {
    it('should create review alerts', async () => {
      const mockEssay = {
        id: 1,
        createdDate: new Date(),
        author: { id: 1, nickname: 'nickname' },
        title: 'title',
      };

      utilsService.formatDateToKorean.mockReturnValue('2024-01-01');
      alertRepository.saveAlert.mockResolvedValue({} as any);

      await service.createReviewAlerts(mockEssay as any, EssayStatus.PUBLISHED);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockEssay.author,
          title: '2024-01-01에 published 요청하신 글에 대한 내용이 업데이트 됐어요.',
          content: '2024-01-01에 작성하신 "title" 게시물이 비공개 처리되었습니다.',
          body: '해당 글이 커뮤니티 가이드라인을 준수하는지 검토 후 알려드릴게요!',
          type: AlertType.SUPPORT,
        }),
      );
    });
  });

  describe('sendPushReviewAlert', () => {
    it('should send push notifications for review alerts', async () => {
      const mockEssay = { id: 1, author: { id: 1, nickname: 'nickname' } };
      const mockDevices = [{ deviceId: 'device1', deviceToken: 'token1' }];
      const mockAlertSettings = { report: true };

      supportService.getDevices.mockResolvedValue(mockDevices as any);
      supportService.fetchSettingEntityById.mockResolvedValue(mockAlertSettings as any);

      await service.sendPushReviewAlert(mockEssay as any);

      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token1',
        '작성하신 글에 대한 업데이트가 있어요.',
        '발행 또는 링크드아웃하신 글이 검토 후 공개될 예정이에요.',
      );
    });

    it('should not send push notifications if no devices found', async () => {
      const mockEssay = { author: { id: 1 } } as any;

      supportService.getDevices.mockResolvedValue([]);

      await service.sendPushReviewAlert(mockEssay);

      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });

  describe('createReviewResultAlert', () => {
    it('should create review result alerts', async () => {
      const mockReview = {
        id: 1,
        type: 'published',
        essay: { id: 1, createdDate: new Date() },
        user: { id: 1 },
      } as any;
      const actionType = ActionType.APPROVED;
      const mockUser = { id: 1 } as User;

      utilsService.formatDateToKorean.mockReturnValue('2024-01-01');
      userService.fetchUserEntityById.mockResolvedValue(mockUser);
      alertRepository.saveAlert.mockResolvedValue({} as any);

      await service.createReviewResultAlert(mockReview, actionType);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          title: '2024-01-01에 작성하신 글에 대한 내용이 업데이트 됐어요.',
          content: '2024-01-01에 작성하신 게시물이 공개처리되었습니다.',
          body: '해당 글은 검토 결과 커뮤니티 가이드라인에 따라 공개 처리되었음을 알려드립니다. 기다려주셔서 감사합니다.',
          type: AlertType.SUPPORT,
        }),
      );
    });
  });

  describe('sendPushReviewResultAlert', () => {
    it('should send push notifications for review result alerts', async () => {
      const userId = 1;
      const actionType = ActionType.APPROVED;
      const mockDevices = [{ deviceId: 'device1', deviceToken: 'token1' }];
      const mockAlertSettings = { report: true };

      supportService.getDevices.mockResolvedValue(mockDevices as any);
      supportService.fetchSettingEntityById.mockResolvedValue(mockAlertSettings as any);

      await service.sendPushReviewResultAlert(userId, actionType);

      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token1',
        '작성하신 글에 대한 업데이트가 있어요.',
        '발행 또는 링크드아웃하신 글이 검토 후 공개 상태로 전환됐어요.',
      );
    });

    it('should not send push notifications if no devices found', async () => {
      const userId = 1;
      const actionType = ActionType.APPROVED;

      supportService.getDevices.mockResolvedValue([]);

      await service.sendPushReviewResultAlert(userId, actionType);

      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });

  describe('createAlertFirstView', () => {
    it('should create a first view alert', async () => {
      const mockEssay = {
        id: 1,
        createdDate: new Date(),
        author: { id: 1, nickname: 'nickname' },
        title: 'title',
        status: EssayStatus.LINKEDOUT,
      };

      utilsService.formatDateToKorean.mockReturnValue('2024-01-01');
      utilsService.extractPartContent.mockReturnValue('partial content');
      alertRepository.saveAlert.mockResolvedValue({} as any);

      await service.createAlertFirstView(mockEssay as any);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockEssay.author,
          title: expect.any(String),
          content: 'partial content',
          body: `로 시작하는 글, 기억하시나요?\n\n2024-01-01에\n링크드아웃한 글이 발견됐어요.`,
          type: AlertType.LINKEDOUT,
        }),
      );
    });
  });

  describe('sendPushAlertFirstView', () => {
    it('should send push notifications for first view alerts', async () => {
      const mockEssay = { id: 1, author: { id: 1, nickname: 'nickname' } } as any;
      const mockDevices = [{ deviceId: 'device1', deviceToken: 'token1' }] as any;
      const mockAlertSettings = { viewed: true } as any;

      supportService.getDevices.mockResolvedValue(mockDevices);
      supportService.fetchSettingEntityById.mockResolvedValue(mockAlertSettings);

      await service.sendPushAlertFirstView(mockEssay);

      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token1',
        '다른 아무개가 nickname 아무개님의 글을 발견!',
        '사람들이 nickname 아무개님의 이야기를 읽기 시작했어요!',
      );
    });

    it('should not send push notifications if no devices found', async () => {
      const mockEssay = { author: { id: 1 } } as any;
      supportService.getDevices.mockResolvedValue([]);

      await service.sendPushAlertFirstView(mockEssay);

      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });
});
