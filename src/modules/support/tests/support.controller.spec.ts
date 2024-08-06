import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from '../support.controller';
import { SupportService } from '../support.service';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { InquiryReqDto } from '../dto/request/inquiryReq.dto';
import { UpdateAlertSettingsReqDto } from '../dto/request/updateAlertSettings.dto';
import { RegisterDeviceReqDto } from '../dto/request/registerDeviceReq.dto';
import { NoticeResDto } from '../dto/response/noticeRes.dto';
import { InquiryResDto } from '../dto/response/inquiryRes.dto';
import { AlertSettingsResDto } from '../dto/response/alertSettingsRes.dto';

jest.mock('../support.service');

describe('SupportController', () => {
  let controller: SupportController;
  let service: jest.Mocked<SupportService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [SupportService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<SupportController>(SupportController);
    service = module.get<SupportService>(SupportService) as jest.Mocked<SupportService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotices', () => {
    it('should call service getNotices method', async () => {
      const page = 1;
      const limit = 10;
      const notices = { items: [], total: 0 };

      service.getNotices.mockResolvedValue(notices as any);

      const response = await controller.getNotices(page, limit);
      expect(service.getNotices).toHaveBeenCalledWith(page, limit);
      expect(response).toEqual(notices);
    });
  });

  describe('getNotice', () => {
    it('should call service getNotice method', async () => {
      const noticeId = 1;
      const notice: NoticeResDto = {
        id: 1,
        title: 'Notice',
        content: 'Content',
        createdDate: new Date(),
      };

      service.getNotice.mockResolvedValue(notice);

      const response = await controller.getNotice(noticeId);
      expect(service.getNotice).toHaveBeenCalledWith(noticeId);
      expect(response).toEqual(notice);
    });
  });

  describe('createInquiry', () => {
    it('should call service createInquiry method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const data: InquiryReqDto = { title: 'Inquiry', content: 'Content', type: 'General' };
      const inquiry = { id: 1, ...data, createdAt: new Date() };

      service.createInquiry.mockResolvedValue(inquiry as any);

      const response = await controller.createInquiry(req, data);
      expect(service.createInquiry).toHaveBeenCalledWith(req.user.id, data);
      expect(response).toEqual(inquiry);
    });
  });

  describe('getInquiries', () => {
    it('should call service getInquiries method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const inquiries = { items: [], total: 0 };

      service.getInquiries.mockResolvedValue(inquiries as any);

      const response = await controller.getInquiries(req);
      expect(service.getInquiries).toHaveBeenCalledWith(req.user.id);
      expect(response).toEqual(inquiries);
    });
  });

  describe('getInquiry', () => {
    it('should call service getInquiry method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const inquiryId = 1;
      const inquiry: InquiryResDto = {
        id: 1,
        title: 'Inquiry',
        content: 'Content',
        answer: 'answer',
        createdDate: new Date(),
        processed: true,
      };

      service.getInquiry.mockResolvedValue(inquiry);

      const response = await controller.getInquiry(req, inquiryId);
      expect(service.getInquiry).toHaveBeenCalledWith(req.user.id, inquiryId);
      expect(response).toEqual(inquiry);
    });
  });

  describe('getUserUpdateHistories', () => {
    it('should call service getUserUpdateHistories method', async () => {
      const page = 1;
      const limit = 10;
      const histories = { items: [], total: 0 };

      service.getUserUpdateHistories.mockResolvedValue(histories as any);

      const response = await controller.getUserUpdateHistories(page, limit);
      expect(service.getUserUpdateHistories).toHaveBeenCalledWith(page, limit);
      expect(response).toEqual(histories);
    });
  });

  describe('getSettings', () => {
    it('should call service getSettings method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const deviceId = 'device123';
      const settings: AlertSettingsResDto = { viewed: true, report: false, marketing: false };

      service.getSettings.mockResolvedValue(settings);

      const response = await controller.getSettings(req, deviceId);
      expect(service.getSettings).toHaveBeenCalledWith(req.user.id, deviceId);
      expect(response).toEqual(settings);
    });
  });

  describe('updateSettings', () => {
    it('should call service updateSettings method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const deviceId = 'device123';
      const data: UpdateAlertSettingsReqDto = { viewed: true, report: false, marketing: false };

      await controller.updateSettings(req, deviceId, data);
      expect(service.updateSettings).toHaveBeenCalledWith(req.user.id, data, deviceId);
    });
  });

  describe('registerDevice', () => {
    it('should call service registerDevice method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const data: RegisterDeviceReqDto = { deviceId: 'device123', deviceToken: 'token123' };

      jest.spyOn(service, 'registerDevice').mockResolvedValue({} as any);

      await controller.registerDevice(req, data);

      expect(service.registerDevice).toHaveBeenCalledWith(req, data.deviceId, data.deviceToken);
    });
  });
});
