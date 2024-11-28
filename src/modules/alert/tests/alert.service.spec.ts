import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from '../core/alert.service';
import { AlertRepository } from '../infrastructure/alert.repository';
import { UtilsService } from '../../utils/utils.service';
import { SupportService } from '../../support/support.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { UserService } from '../../user/user.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ActionType, AlertType, EssayStatus } from '../../../common/types/enum.types';
import { AwsService } from '../../aws/core/aws.service';

jest.mock('../infrastructure/alert.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../support/support.service');
jest.mock('../../firebase/firebase.service');
jest.mock('../../user/user.service');
jest.mock('../../aws/core/aws.service');

describe('AlertService', () => {
  let alertService: AlertService;
  let alertRepository: jest.Mocked<AlertRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let userService: jest.Mocked<UserService>;
  let supportService: jest.Mocked<SupportService>;
  let fcmService: jest.Mocked<FirebaseService>;
  let awsService: jest.Mocked<AwsService>;
  let alertQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        { provide: AlertRepository, useClass: AlertRepository },
        { provide: UtilsService, useClass: UtilsService },
        { provide: UserService, useClass: UserService },
        { provide: SupportService, useClass: SupportService },
        { provide: FirebaseService, useClass: FirebaseService },
        { provide: AwsService, useClass: AwsService },
        { provide: getQueueToken('alert'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    alertService = module.get<AlertService>(AlertService);
    alertRepository = module.get(AlertRepository) as jest.Mocked<AlertRepository>;
    utilsService = module.get(UtilsService) as jest.Mocked<UtilsService>;
    userService = module.get(UserService) as jest.Mocked<UserService>;
    supportService = module.get(SupportService) as jest.Mocked<SupportService>;
    fcmService = module.get(FirebaseService) as jest.Mocked<FirebaseService>;
    awsService = module.get(AwsService) as jest.Mocked<AwsService>;
    alertQueue = module.get(getQueueToken('alert')) as jest.Mocked<Queue>;

    utilsService.transformToDto.mockImplementation((_, any) => any);
  });

  describe('hasUnreadAlerts', () => {
    it('읽지 않은 알림이 있으면 true를 반환.', async () => {
      alertRepository.countingAlert = jest.fn().mockResolvedValue(1);

      const result = await alertService.hasUnreadAlerts(1);
      expect(result).toBe(true);
    });

    it('읽지 않은 알림이 없으면 false를 반환.', async () => {
      alertRepository.countingAlert = jest.fn().mockResolvedValue(0);

      const result = await alertService.hasUnreadAlerts(1);
      expect(result).toBe(false);
    });
  });

  describe('getAlerts', () => {
    it('페이징 정보가 포함된 알림을 반환.', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const total = 25;
      const alerts = [
        { id: 1, title: '알림1' },
        { id: 2, title: '알림2' },
      ] as any;

      alertRepository.findAlerts.mockResolvedValue({ alerts, total });

      const result = await alertService.getAlerts(userId, page, limit);

      expect(alertRepository.findAlerts).toHaveBeenCalledWith(userId, page, limit);
      expect(result).toEqual({
        alerts,
        total,
        page,
        totalPage: Math.ceil(total / limit),
      });
    });
  });

  describe('markAlertAsRead', () => {
    const userId = 1;
    const alertId = 1;
    const alert = { id: 1, title: '알림', read: true } as any;
    it('알림을 읽음처리', async () => {
      alertRepository.findAlert.mockResolvedValue(alert);

      await alertService.markAlertAsRead(userId, alertId);

      expect(alertRepository.findAlert).toHaveBeenCalledWith(userId, alertId);
      expect(alert.read).toBe(true);
      expect(alertRepository.saveAlert).toHaveBeenCalledWith(alert);
    });

    it('알림을 찾을 수 없음', async () => {
      alertRepository.findAlert.mockResolvedValue(null);

      await expect(alertService.markAlertAsRead(userId, alertId)).rejects.toThrow(
        new HttpException('알림을 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );

      expect(alertRepository.saveAlert).not.toHaveBeenCalled();
    });
  });

  describe('createAndSendReportProcessedAlerts', () => {
    it('reports를 배치로 나누어 alertQueue에 작업을 추가', async () => {
      const reports = [
        { id: 1, message: 'Report 1' },
        { id: 2, message: 'Report 2' },
        { id: 3, message: 'Report 3' },
        { id: 4, message: 'Report 4' },
        { id: 5, message: 'Report 5' },
        { id: 6, message: 'Report 6' },
      ] as any;
      const type = ActionType.UPDATED;

      const addSpy = jest.spyOn(alertService['alertQueue'], 'add').mockResolvedValue(undefined);

      await alertService.createAndSendReportProcessedAlerts(reports, type);

      // 각 배치에 대해 add 호출을 검증
      expect(addSpy).toHaveBeenCalledTimes(2);

      // 첫 번째 호출
      expect(addSpy).toHaveBeenCalledWith(
        'createAndSendReportProcessedAlerts',
        { batch: reports.slice(0, 5), type },
        {
          attempts: 5,
          backoff: 5000,
          delay: 0,
        },
      );

      // 두 번째 호출
      expect(addSpy).toHaveBeenCalledWith(
        'createAndSendReportProcessedAlerts',
        { batch: reports.slice(5, 6), type },
        {
          attempts: 5,
          backoff: 5000,
          delay: 15000,
        },
      );
    });
  });

  describe('processReportAlerts', () => {
    const mockReports = [
      {
        reporter: { id: 1, essay: { status: EssayStatus.PUBLISHED }, createdDate: new Date() },
      },
    ] as any;

    const type = ActionType.APPROVED;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('사용자가 알림 설정을 허용할 경우 푸시 알림을 전송', async () => {
      jest.spyOn(alertService, 'createReportProcessedAlert').mockImplementation(
        async () =>
          ({
            id: 1,
            title: 'Mock Alert',
            content: 'Mock content',
          }) as any,
      );

      // Mock 설정: 사용자를 가져오고 장치를 반환하며, 알림 설정이 허용된 상태로 설정
      userService.fetchUserEntityById = jest.fn().mockResolvedValue({ id: 1, name: 'User1' });
      supportService.getDevicesByUserId = jest
        .fn()
        .mockResolvedValue([{ id: 1, fcmToken: 'token1' }]);
      supportService.fetchSettingEntityById = jest.fn().mockResolvedValue({ report: true });
      fcmService.sendPushAlert = jest.fn();

      await alertService.processReportAlerts(mockReports, type);

      // 호출 검증
      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(mockReports[0].reporter.id);
      expect(supportService.getDevicesByUserId).toHaveBeenCalledWith(mockReports[0].reporter.id);
      expect(supportService.fetchSettingEntityById).toHaveBeenCalledWith(
        mockReports[0].reporter.id,
        1,
      );
      expect(fcmService.sendPushAlert).toHaveBeenCalledWith(
        'token1',
        '신고 결과를 알려드릴려고 왔어요!',
        '요청하신 지원에 대한 업데이트가 있어요.',
      );
    });

    it('사용자의 장치가 없거나 알림 설정이 꺼져 있으면 푸시 알림을 전송하지 않음', async () => {
      jest.spyOn(alertService, 'createReportProcessedAlert').mockImplementation(
        async () =>
          ({
            id: 1,
            title: 'Mock Alert',
            content: 'Mock content',
          }) as any,
      );

      // Mock 설정: 장치가 없거나 알림 설정이 꺼져 있는 경우
      userService.fetchUserEntityById = jest.fn().mockResolvedValue({ id: 1, name: 'User1' });
      supportService.getDevicesByUserId = jest
        .fn()
        .mockResolvedValue([{ id: 1, fcmToken: 'token1' }]);
      supportService.fetchSettingEntityById = jest.fn().mockResolvedValue({ report: false });
      fcmService.sendPushAlert = jest.fn();

      await alertService.processReportAlerts(mockReports, type);

      // 호출 검증: sendPushAlert가 호출되지 않아야 함
      expect(fcmService.sendPushAlert).not.toHaveBeenCalled();
    });
  });

  describe('createReportProcessedAlerts', () => {
    const user = { id: 1 } as any;
    const report = { createdDate: new Date(), essay: { status: EssayStatus.PUBLISHED } } as any;
    const type = ActionType.APPROVED;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Alert 객체를 생성하고 saveAlert 메서드를 호출', async () => {
      utilsService.formatDateToKorean.mockReturnValue('2023년 10월 20일');
      alertRepository.saveAlert.mockResolvedValue({ id: 1, title: 'mock title' } as any);

      const result = await alertService.createReportProcessedAlert(user, report, type);

      expect(alertRepository.saveAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          title: '2023년 10월 20일에 요청하신 지원에 대한 내용이 업데이트 되었습니다.',
          content: '2023년 10월 20일에 신고하신 게시물이 비공개 처리되었습니다.',
          body: '해당 글을 검토한 결과 커뮤니티 가이드라인을 위반하는 콘텐츠를 포함하고 있어 비공개 처리되었습니다. 신고해주셔서 감사합니다!',
          type: AlertType.SUPPORT,
        }),
      );

      expect(result).toEqual({ id: 1, title: 'mock title' });
    });
  });
});
