import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from '../support.service';
import { SupportRepository } from '../support.repository';
import { UtilsService } from '../../utils/utils.service';
import { UserService } from '../../user/user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InquiryReqDto } from '../dto/request/inquiryReq.dto';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../support.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../user/user.service');

describe('SupportService', () => {
  let service: SupportService;
  let supportRepository: jest.Mocked<SupportRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService, SupportRepository, UtilsService, UserService],
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
      const user = { id: userId } as any;

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

  describe('getUserUpdateHistories', () => {
    it('should return user update histories', async () => {
      const page = 1;
      const limit = 10;
      const histories = [{ id: 1, content: 'Update 1' }] as any;
      const total = histories.length;

      supportRepository.findUserUpdateHistories.mockResolvedValue({ histories, total });
      utilsService.transformToDto.mockReturnValue(histories);

      const result = await service.getUserUpdateHistories(page, limit);

      expect(supportRepository.findUserUpdateHistories).toHaveBeenCalledWith(page, limit);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), histories);
      expect(result).toEqual({
        histories,
        total,
        page,
        totalPage: Math.ceil(total / limit),
      });
    });
  });

  describe('getSettings', () => {
    it('should return user settings', async () => {
      const userId = 1;
      const deviceId = 'device1';
      const settings = { id: 1, user: { id: userId }, deviceId } as any;

      supportRepository.findSettings.mockResolvedValue(settings);
      utilsService.transformToDto.mockReturnValue(settings);

      const result = await service.getSettings(userId, deviceId);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(expect.any(Function), settings);
      expect(result).toEqual(settings);
    });

    it('should create new settings if not found', async () => {
      const userId = 1;
      const deviceId = 'device1';
      const user = { id: userId } as any;
      const settings = { id: 1, user, deviceId } as any;

      supportRepository.findSettings.mockResolvedValue(null);
      userService.fetchUserEntityById.mockResolvedValue(user);
      supportRepository.saveSettings.mockResolvedValue(settings);
      utilsService.transformToDto.mockReturnValue(settings);

      const result = await service.getSettings(userId, deviceId);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(supportRepository.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          deviceId,
        }),
      );
      expect(result).toEqual(settings);
    });

    it('should throw an error if deviceId is missing', async () => {
      const userId = 1;
      const deviceId = '';

      await expect(service.getSettings(userId, deviceId)).rejects.toThrow(
        new HttpException('Missing parameter.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      const userId = 1;
      const deviceId = 'device1';
      const settingsData = { alertsEnabled: true } as any;
      const settings = { id: 1, user: { id: userId }, deviceId } as any;

      supportRepository.findSettings.mockResolvedValue(settings);

      await service.updateSettings(userId, settingsData, deviceId);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(supportRepository.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining(settings),
      );
    });

    it('should create new settings if not found', async () => {
      const userId = 1;
      const deviceId = 'device1';
      const settingsData = { alertsEnabled: true } as any;
      const newSettings = { id: 1, user: { id: userId }, deviceId } as any;

      supportRepository.findSettings.mockResolvedValue(null);
      supportRepository.createAlertSettings.mockResolvedValue(newSettings);
      supportRepository.saveSettings.mockResolvedValue(newSettings);

      await service.updateSettings(userId, settingsData, deviceId);

      expect(supportRepository.findSettings).toHaveBeenCalledWith(userId, deviceId);
      expect(supportRepository.createAlertSettings).toHaveBeenCalledWith(settingsData, userId);
      expect(supportRepository.saveSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should throw an error if deviceId is missing', async () => {
      const userId = 1;
      const deviceId = '';
      const settingsData = { alertsEnabled: true } as any;

      await expect(service.updateSettings(userId, settingsData, deviceId)).rejects.toThrow(
        new HttpException('Missing parameter.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('fetchSettingEntityById', () => {
    it('should fetch settings entity by userId and deviceId', async () => {
      const userId = 1;
      const deviceId = 'device1';
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
      const deviceId = 'device1';
      const deviceToken = 'token1';
      const user = { id: userId } as any;
      const device = { id: 1, deviceId, deviceToken } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);
      supportRepository.findDevice.mockResolvedValue(null);
      supportRepository.createDevice.mockResolvedValue(device);
      supportRepository.saveDevice.mockResolvedValue(device);

      const result = await service.registerDevice(userId, deviceId, deviceToken);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(supportRepository.findDevice).toHaveBeenCalledWith(deviceId);
      expect(supportRepository.createDevice).toHaveBeenCalledWith(user, deviceId, deviceToken);
      expect(supportRepository.saveDevice).toHaveBeenCalledWith(device);
      expect(result).toEqual(device);
    });

    it('should update existing device token if device already exists', async () => {
      const userId = 1;
      const deviceId = 'device1';
      const deviceToken = 'token1';
      const user = { id: userId } as any;
      const device = { id: 1, deviceId, deviceToken: 'oldToken' } as any;

      userService.fetchUserEntityById.mockResolvedValue(user);
      supportRepository.findDevice.mockResolvedValue(device);
      supportRepository.saveDevice.mockResolvedValue({ ...device, deviceToken });

      const result = await service.registerDevice(userId, deviceId, deviceToken);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(supportRepository.findDevice).toHaveBeenCalledWith(deviceId);
      expect(supportRepository.saveDevice).toHaveBeenCalledWith({ ...device, deviceToken });
      expect(result).toEqual({ ...device, deviceToken });
    });
  });

  describe('getDevices', () => {
    it('should return devices by userId', async () => {
      const userId = 1;
      const devices = [{ id: 1, deviceId: 'device1' }] as any;

      supportRepository.findDevices.mockResolvedValue(devices);

      const result = await service.getDevices(userId);

      expect(supportRepository.findDevices).toHaveBeenCalledWith(userId);
      expect(result).toEqual(devices);
    });
  });
});
