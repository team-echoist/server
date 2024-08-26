import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from '../support.service';
import { SupportRepository } from '../support.repository';
import { UtilsService } from '../../utils/utils.service';
import { UserService } from '../../user/user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InquiryReqDto } from '../dto/request/inquiryReq.dto';
import { Request as ExpressRequest } from 'express';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../support.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../user/user.service');
jest.mock('ioredis');

describe('SupportService', () => {
  let service: SupportService;
  let supportRepository: jest.Mocked<SupportRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let userService: jest.Mocked<UserService>;

  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
    setex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        UtilsService,
        SupportRepository,
        UserService,
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    supportRepository = module.get(SupportRepository);
    utilsService = module.get(UtilsService);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotices', () => {
    it('should return notices', async () => {
      const page = 1;
      const limit = 10;
      const notices = [{ id: 1, title: 'Notice 1' }] as any;
      const total = notices.length;

      supportRepository.findNotices.mockResolvedValue({ notices, total });
      utilsService.transformToDto.mockReturnValue(notices);

      const result = await service.getNotices(page, limit);

      expect(supportRepository.findNotices).toHaveBeenCalledWith(page, limit);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), notices);
      expect(result).toEqual({
        Notices: notices,
        total,
        page,
        totalPage: Math.ceil(total / limit),
      });
    });
  });

  describe('getNotice', () => {
    it('should return a notice by id', async () => {
      const noticeId = 1;
      const notice = { id: noticeId, title: 'Notice 1' } as any;

      supportRepository.findNotice.mockResolvedValue(notice);
      utilsService.transformToDto.mockReturnValue(notice);

      const result = await service.getNotice(noticeId);

      expect(supportRepository.findNotice).toHaveBeenCalledWith(noticeId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), notice);
      expect(result).toEqual(notice);
    });
  });

  describe('createInquiry', () => {
    it('should create an inquiry', async () => {
      const userId = 1;
      const data = {
        title: 'Inquiry 1',
        content: 'Content 1',
        type: 'type1',
      } as InquiryReqDto;
      const user = { id: userId, devices: ['device1', 'device2'] } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);

      await service.createInquiry(userId, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(supportRepository.saveInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          content: data.content,
          type: data.type,
          title: data.title,
        }),
      );
    });
  });

  describe('getInquiries', () => {
    it('should return inquiries', async () => {
      const userId = 1;
      const inquiries = [{ id: 1, title: 'Inquiry 1' }] as any;

      supportRepository.findInquiries.mockResolvedValue(inquiries);
      utilsService.transformToDto.mockReturnValue(inquiries);

      const result = await service.getInquiries(userId);

      expect(supportRepository.findInquiries).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), inquiries);
      expect(result).toEqual(inquiries);
    });
  });

  describe('getInquiry', () => {
    it('should return an inquiry by id', async () => {
      const userId = 1;
      const inquiryId = 1;
      const inquiry = { id: inquiryId, title: 'Inquiry 1' } as any;

      supportRepository.findInquiry.mockResolvedValue(inquiry);
      utilsService.transformToDto.mockReturnValue(inquiry);

      const result = await service.getInquiry(userId, inquiryId);

      expect(supportRepository.findInquiry).toHaveBeenCalledWith(userId, inquiryId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), inquiry);
      expect(result).toEqual(inquiry);
    });
  });

  describe('getSettings', () => {
    it('should return user settings', async () => {
      const req: ExpressRequest = {
        user: { id: 1 },
        device: { os: 'os', model: 'model', type: 'type' },
      } as any;
      const userId = 1;
      const deviceId = 1;
      const settings = { id: 1, user: { id: userId }, deviceId } as any;
      const user = {
        id: 1,
        devices: [{ id: 1, os: 'os', model: 'model', type: 'type' }],
      } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);
      supportRepository.findSettings.mockResolvedValue(settings);
      utilsService.transformToDto.mockReturnValue(settings);

      const result = await service.getSettings(req);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), settings);
      expect(result).toEqual(settings);
    });

    it('should throw an error if deviceId is missing', async () => {
      const req: ExpressRequest = {
        user: { id: 1 },
        device: { os: 'os', model: 'model', type: 'type' },
      } as any;

      await expect(service.getSettings(req)).rejects.toThrow(
        new HttpException(
          "Cannot read properties of undefined (reading 'devices')",
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      const userId = 1;
      const deviceId = 1;
      const settingsData = { alertsEnabled: true } as any;
      const settings = { id: 1, user: { id: userId }, deviceId } as any;
      const req: ExpressRequest = {
        user: { id: 1 },
        device: { os: 'os', model: 'model', type: 'type' },
      } as any;

      const user = {
        id: 1,
        devices: [{ id: 1, os: 'os', model: 'model', type: 'type' }],
      } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);

      supportRepository.findSettings.mockResolvedValue(settings);

      await service.updateSettings(req, settingsData);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(supportRepository.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining(settings),
      );
    });

    it('should create new settings if not found', async () => {
      const userId = 1;
      const deviceId = 1;
      const device = {
        id: deviceId,
        uid: 'uid',
        fcmToken: 'token',
        os: 'os',
        type: 'type',
        model: 'model',
      } as any;
      const settingsData = { alertsEnabled: true } as any;
      const newSettings = { id: 1, user: { id: userId }, deviceId } as any;
      const req: ExpressRequest = {
        user: { id: 1 },
        device: { os: 'os', model: 'model', type: 'type' },
      } as any;

      const user = {
        id: 1,
        devices: [{ id: 1, os: 'os', model: 'model', type: 'type' }],
      } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);

      supportRepository.findDevice.mockResolvedValue(device);
      supportRepository.findSettings.mockResolvedValue(null);
      supportRepository.createAlertSettings.mockResolvedValue(newSettings);
      supportRepository.saveSettings.mockResolvedValue(newSettings);

      await service.updateSettings(req, settingsData);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(supportRepository.createAlertSettings).toHaveBeenCalledWith(
        settingsData,
        userId,
        deviceId,
      );
      expect(supportRepository.saveSettings).toHaveBeenCalledWith(newSettings);
    });

    describe('fetchSettingEntityById', () => {
      it('should fetch settings entity by userId and deviceId', async () => {
        const userId = 1;
        const deviceId = 1;
        const settings = { id: 1, user: { id: userId }, deviceId } as any;

        supportRepository.findSettings.mockResolvedValue(settings);

        const result = await service.fetchSettingEntityById(userId, deviceId);

        expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
        expect(result).toEqual(settings);
      });
    });

    describe('registerDevice', () => {
      it('should register a device', async () => {
        const userId = 1;
        const uid = 'uid';
        const deviceToken = 'token1';
        const user = { id: userId, devices: [] } as any;
        const device = { id: 1, uid, deviceToken } as any;
        const req = { user, device: { os: 'iOS', type: 'mobile', model: 'iPhone' } } as any;

        userService.fetchUserEntityById.mockResolvedValue(user);
        supportRepository.findDevice.mockResolvedValue(null);
        supportRepository.createDevice.mockResolvedValue(device);
        supportRepository.saveDevice.mockResolvedValue(device);

        const result = await service.registerDevice(req, uid, deviceToken);

        expect(userService.fetchUserEntityById).toHaveBeenCalledWith(user.id);
        expect(supportRepository.saveDevice).toHaveBeenCalledWith(device);
      });

      it('should update existing device token if device already exists', async () => {
        const userId = 1;
        const uid = 'uid';
        const fcmToken = 'token1';
        const device = {
          id: 1,
          uid,
          fcmToken: 'oldToken',
          os: 'iOS',
          type: 'mobile',
          model: 'iPhone',
        } as any;
        const user = { id: userId, devices: [device] } as any;

        const req = {
          user: { id: userId },
          device: { os: 'iOS', type: 'mobile', model: 'iPhone' },
        } as any;

        userService.fetchUserEntityById.mockResolvedValue(user);
        supportRepository.findDevice.mockResolvedValue(device);
        supportRepository.saveDevice.mockResolvedValue({ ...device, fcmToken });

        const result = await service.registerDevice(req, uid, fcmToken);

        expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);

        expect(supportRepository.saveDevice).toHaveBeenCalledWith({ ...device, fcmToken });
      });
    });

    describe('getDevices', () => {
      it('should return devices by userId', async () => {
        const userId = 1;
        const devices = [{ id: 1, deviceId: 'device1' }] as any;

        supportRepository.findDevices.mockResolvedValue(devices);

        const result = await service.getDevicesByUserId(userId);

        expect(supportRepository.findDevices).toHaveBeenCalledWith(userId);
        expect(result).toEqual(devices);
      });
    });
  });
});
