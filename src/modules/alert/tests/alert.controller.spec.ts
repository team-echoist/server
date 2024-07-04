import { Test, TestingModule } from '@nestjs/testing';
import { AlertController } from '../alert.controller';
import { AlertService } from '../alert.service';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

jest.mock('../alert.service');

describe('AlertController', () => {
  let controller: AlertController;
  let service: jest.Mocked<AlertService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [AlertController],
      providers: [AlertService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AlertController>(AlertController);
    service = module.get<AlertService>(AlertService) as jest.Mocked<AlertService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('hasUnreadAlerts', () => {
    it('should call service hasUnreadAlerts method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      service.hasUnreadAlerts.mockResolvedValue(true);

      const result = await controller.hasUnreadAlerts(req);
      expect(service.hasUnreadAlerts).toHaveBeenCalledWith(1);
      expect(result).toEqual(true);
    });
  });

  describe('getAlerts', () => {
    it('should call service getAlerts method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 10;
      const alerts = { alerts: [], total: 0, page: 0, totalPage: 0 };
      service.getAlerts.mockResolvedValue(alerts);

      const result = await controller.getAlerts(req, page, limit);
      expect(service.getAlerts).toHaveBeenCalledWith(1, page, limit);
      expect(result).toEqual(alerts);
    });
  });

  describe('markAlertAsRead', () => {
    it('should call service markAlertAsRead method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const alertId = 1;

      await controller.markAlertAsRead(req, alertId);
      expect(service.markAlertAsRead).toHaveBeenCalledWith(1, alertId);
    });
  });
});
