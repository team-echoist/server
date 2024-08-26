import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from '../alert.service';
import { AlertRepository } from '../alert.repository';
import { UtilsService } from '../../utils/utils.service';
import { SupportService } from '../../support/support.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { UserService } from '../../user/user.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { Alert } from '../../../entities/alert.entity';
import { ActionType, EssayStatus } from '../../../common/types/enum.types';

describe('AlertService', () => {
  let service: AlertService;
  let alertRepository: AlertRepository;
  let utilsService: UtilsService;
  let supportService: SupportService;
  let fcmService: FirebaseService;
  let userService: UserService;
  let alertQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: AlertRepository,
          useValue: {
            countingAlert: jest.fn(),
            findAlerts: jest.fn(),
            findAlert: jest.fn(),
            saveAlert: jest.fn(),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            transformToDto: jest.fn(),
            formatDateToKorean: jest.fn(),
            extractPartContent: jest.fn(),
          },
        },
        {
          provide: SupportService,
          useValue: {
            getDevicesByUserId: jest.fn(),
            fetchSettingEntityById: jest.fn(),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            sendPushAlert: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            fetchUserEntityById: jest.fn(),
          },
        },
        {
          provide: getQueueToken('alert'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
    alertRepository = module.get<AlertRepository>(AlertRepository);
    utilsService = module.get<UtilsService>(UtilsService);
    supportService = module.get<SupportService>(SupportService);
    fcmService = module.get<FirebaseService>(FirebaseService);
    userService = module.get<UserService>(UserService);
    alertQueue = module.get<Queue>(getQueueToken('alert'));
  });

  it('신고 처리 알림 생성', async () => {
    const mockUser = { id: 1 } as any;
    const mockReport = { essay: { status: EssayStatus.PUBLISHED }, createdDate: new Date() } as any;
    const mockAlert = new Alert();
    mockAlert.title = '2024-08-21';
    jest.spyOn(userService, 'fetchUserEntityById').mockResolvedValue(mockUser);
    jest.spyOn(alertRepository, 'saveAlert').mockResolvedValue(mockAlert);
    jest.spyOn(utilsService, 'formatDateToKorean').mockReturnValue('2024-08-21');

    const result = await service.createReportProcessedAlert(
      mockUser,
      mockReport,
      ActionType.APPROVED,
    );

    expect(result).toBe(mockAlert);
    expect(alertRepository.saveAlert).toHaveBeenCalled();
    expect(result.title).toContain('2024-08-21');
  });

  it('신고 처리 알림 샌드', async () => {
    const mockReport = {
      reporter: { id: 1 },
      essay: { id: 1, status: EssayStatus.PUBLISHED },
    } as any;
    const mockDevice = { id: 1, fcmToken: 'token' } as any;
    const mockAlertSettings = { report: true } as any;
    const mockUser = { id: 1 } as any;
    jest.spyOn(userService, 'fetchUserEntityById').mockResolvedValue(mockUser);
    jest.spyOn(supportService, 'getDevicesByUserId').mockResolvedValue([mockDevice]);
    jest.spyOn(supportService, 'fetchSettingEntityById').mockResolvedValue(mockAlertSettings);
    jest.spyOn(fcmService, 'sendPushAlert').mockResolvedValue(undefined);

    await service.processReportAlerts([mockReport], ActionType.APPROVED);

    expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
      'token',
      '신고 결과를 알려드릴려고 왔어요!',
      '요청하신 지원에 대한 업데이트가 있어요.',
    );
  });

  it('에세이 작성자에게 알림을 생성', async () => {
    const mockEssay = {
      id: 1,
      createdDate: new Date(),
      author: { id: 1 },
      status: EssayStatus.PUBLISHED,
      title: '테스트 글',
    } as any;
    const mockAlert = new Alert();
    mockAlert.title = '2024-08-21';
    mockAlert.content = '테스트 글';
    jest.spyOn(alertRepository, 'saveAlert').mockResolvedValue(mockAlert);
    jest.spyOn(utilsService, 'formatDateToKorean').mockReturnValue('2024-08-21');

    const result = await service.createReviewAlerts(mockEssay, EssayStatus.PUBLISHED);

    expect(result).toBe(mockAlert);
    expect(alertRepository.saveAlert).toHaveBeenCalled();
    expect(result.title).toContain('2024-08-21');
    expect(result.content).toContain('테스트 글');
  });

  it('에세이 작성자에게 푸시 알림', async () => {
    const mockEssay = { id: 1, author: { id: 1 } } as any;
    const mockDevice = { id: 1, fcmToken: 'token' } as any;
    const mockAlertSettings = { report: true } as any;
    jest.spyOn(supportService, 'getDevicesByUserId').mockResolvedValue([mockDevice]);
    jest.spyOn(supportService, 'fetchSettingEntityById').mockResolvedValue(mockAlertSettings);
    jest.spyOn(fcmService, 'sendPushAlert').mockResolvedValue(undefined);

    await service.sendPushReviewAlert(mockEssay);

    expect(fcmService.sendPushAlert).toHaveBeenCalled();
  });

  it('리뷰 결과 알림', async () => {
    const mockReview = {
      id: 1,
      essay: { createdDate: new Date(), author: { id: 1 } },
      user: { id: 1 },
    } as any;
    const mockAlert = new Alert();
    mockAlert.title = '2024-08-21';
    mockAlert.content = '공개처리되었습니다.';
    jest.spyOn(alertRepository, 'saveAlert').mockResolvedValue(mockAlert);
    jest.spyOn(utilsService, 'formatDateToKorean').mockReturnValue('2024-08-21');

    const result = await service.createReviewResultAlert(mockReview, ActionType.APPROVED);

    expect(result).toBe(mockAlert);
    expect(alertRepository.saveAlert).toHaveBeenCalled();
    expect(result.title).toContain('2024-08-21');
    expect(result.content).toContain('공개처리되었습니다.');
  });

  it('리뷰 결과에 대한 푸시 알림', async () => {
    const mockDevice = { id: 1, fcmToken: 'token' } as any;
    const mockAlertSettings = { report: true } as any;
    jest.spyOn(supportService, 'getDevicesByUserId').mockResolvedValue([mockDevice]);
    jest.spyOn(supportService, 'fetchSettingEntityById').mockResolvedValue(mockAlertSettings);
    jest.spyOn(fcmService, 'sendPushAlert').mockResolvedValue(undefined);

    await service.sendPushReviewResultAlert(1, ActionType.APPROVED);

    expect(fcmService.sendPushAlert).toHaveBeenCalled();
  });

  it('에세이 첫 조회에 대한 알림', async () => {
    const mockEssay = {
      id: 1,
      createdDate: new Date(),
      author: { id: 1 },
      title: '테스트 글',
      content: '테스트 내용',
    } as any;
    const mockAlert = new Alert();
    mockAlert.content = '테스트 내용';
    jest.spyOn(alertRepository, 'saveAlert').mockResolvedValue(mockAlert);
    jest.spyOn(utilsService, 'formatDateToKorean').mockReturnValue('2024-08-21');
    jest.spyOn(utilsService, 'extractPartContent').mockReturnValue('테스트 내용');

    const result = await service.createAlertFirstView(mockEssay);

    expect(result).toBe(mockAlert);
    expect(alertRepository.saveAlert).toHaveBeenCalled();
    expect(result.content).toContain('테스트 내용');
  });

  it('에세이 첫 조회에 대한 푸시 알림', async () => {
    const mockEssay = { id: 1, author: { id: 1, nickname: '닉네임' } } as any;
    const mockDevice = { id: 1, fcmToken: 'token' } as any;
    const mockAlertSettings = { viewed: true } as any;
    jest.spyOn(supportService, 'getDevicesByUserId').mockResolvedValue([mockDevice]);
    jest.spyOn(supportService, 'fetchSettingEntityById').mockResolvedValue(mockAlertSettings);
    jest.spyOn(fcmService, 'sendPushAlert').mockResolvedValue(undefined);

    await service.sendPushAlertFirstView(mockEssay);

    expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
      'token',
      '다른 아무개가 닉네임 아무개님의 글을 발견!',
      '사람들이 닉네임 아무개님의 이야기를 읽기 시작했어요!',
    );
  });
});
