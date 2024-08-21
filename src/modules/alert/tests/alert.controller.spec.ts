import { Test, TestingModule } from '@nestjs/testing';
import { AlertController } from '../alert.controller';
import { AlertService } from '../alert.service';
import { JwtAuthGuard } from '../../../common/guards/jwtAuth.guard';

describe('AlertController', () => {
  let controller: AlertController;
  let alertService: AlertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [
        {
          provide: AlertService,
          useValue: {
            hasUnreadAlerts: jest.fn(),
            getAlerts: jest.fn(),
            markAlertAsRead: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AlertController>(AlertController);
    alertService = module.get<AlertService>(AlertService);
  });

  it('안 읽은 알림 여부를 반환', async () => {
    const mockRequest = { user: { id: 1 } } as any;
    jest.spyOn(alertService, 'hasUnreadAlerts').mockResolvedValue(true);

    const result = await controller.hasUnreadAlerts(mockRequest);

    expect(result).toBe(true);
    expect(alertService.hasUnreadAlerts).toHaveBeenCalledWith(1);
  });

  it('알림 목록을 반환', async () => {
    const mockRequest = { user: { id: 1 } } as any;
    const mockAlerts = [{ id: 1, message: '알림 메시지' }] as any;
    jest.spyOn(alertService, 'getAlerts').mockResolvedValue(mockAlerts);

    const result = await controller.getAlerts(mockRequest, 1, 10);

    expect(result).toBe(mockAlerts);
    expect(alertService.getAlerts).toHaveBeenCalledWith(1, 1, 10);
  });

  it('알림을 읽음 처리', async () => {
    const mockRequest = { user: { id: 1 } } as any;
    jest.spyOn(alertService, 'markAlertAsRead').mockResolvedValue(undefined);

    await controller.markAlertAsRead(mockRequest, 1);

    expect(alertService.markAlertAsRead).toHaveBeenCalledWith(1, 1);
  });
});
