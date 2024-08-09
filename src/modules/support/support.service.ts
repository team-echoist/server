import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { UtilsService } from '../utils/utils.service';
import { NoticeSummaryResDto } from './dto/response/noticeSummaryRes.dto';
import { NoticeResDto } from './dto/response/noticeRes.dto';
import { InquiryReqDto } from './dto/request/inquiryReq.dto';
import { Inquiry } from '../../entities/inquiry.entity';
import { UserService } from '../user/user.service';
import { InquirySummaryResDto } from './dto/response/inquirySummaryRes.dto';
import { InquiryResDto } from './dto/response/inquiryRes.dto';
import { UpdatedHistoryResDto } from './dto/response/updatedHistoryRes.dto';
import { UpdateAlertSettingsReqDto } from './dto/request/updateAlertSettings.dto';
import { AlertSettings } from '../../entities/alertSettings.entity';
import { AlertSettingsResDto } from './dto/response/alertSettingsRes.dto';
import { Transactional } from 'typeorm-transactional';
import { Request as ExpressRequest } from 'express';
import { Device, DeviceType, DeviceOS } from '../../entities/device.entity';
import { User } from '../../entities/user.entity';
import { DeviceDto } from './dto/device.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { VersionsSummaryResDto } from './dto/response/versionsSummaryRes.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly supportRepository: SupportRepository,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getNotices(page: number, limit: number) {
    const { notices, total } = await this.supportRepository.findNotices(page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const noticesDto = this.utilsService.transformToDto(NoticeSummaryResDto, notices);

    return { Notices: noticesDto, total, page, totalPage };
  }

  async getNotice(noticeId: number) {
    const notice = await this.supportRepository.findNotice(noticeId);

    return this.utilsService.transformToDto(NoticeResDto, notice);
  }

  async createInquiry(userId: number, data: InquiryReqDto) {
    const user = await this.userService.fetchUserEntityById(userId);
    const newInquiry = new Inquiry();

    newInquiry.user = user;
    newInquiry.content = data.content;
    newInquiry.type = data.type;
    newInquiry.title = data.title;

    await this.supportRepository.saveInquiry(newInquiry);
  }

  async getInquiries(userId: number) {
    const inquiries = await this.supportRepository.findInquiries(userId);

    return this.utilsService.transformToDto(InquirySummaryResDto, inquiries);
  }

  async getInquiry(userId: number, inquiryId: number) {
    const inquiry = await this.supportRepository.findInquiry(userId, inquiryId);

    return this.utilsService.transformToDto(InquiryResDto, inquiry);
  }

  @Transactional()
  async getUserUpdateHistories(page: number, limit: number) {
    const { histories, total } = await this.supportRepository.findUserUpdateHistories(page, limit);

    const totalPage = Math.ceil(total / limit);
    const historiesDto = this.utilsService.transformToDto(UpdatedHistoryResDto, histories);

    return { histories: historiesDto, total, page, totalPage };
  }

  @Transactional()
  async getSettings(req: ExpressRequest) {
    const user = await this.userService.fetchUserEntityById(req.user.id);
    const currentDevice = await this.findDevice(user, req.device);

    if (!currentDevice)
      throw new HttpException(
        '등록된 디바이스가 없습니다. 디바이스 등록을 진행해주세요.',
        HttpStatus.BAD_REQUEST,
      );

    let settings = await this.supportRepository.findSettings(user.id, currentDevice.id);

    if (!settings) {
      settings = new AlertSettings();
      settings.user = user;
      settings.device = currentDevice;

      settings = await this.supportRepository.saveSettings(settings);
    }

    return this.utilsService.transformToDto(AlertSettingsResDto, settings);
  }

  @Transactional()
  async updateSettings(req: ExpressRequest, settingsData: UpdateAlertSettingsReqDto) {
    const user = await this.userService.fetchUserEntityById(req.user.id);
    const currentDevice = await this.findDevice(user, req.device);

    if (!currentDevice)
      throw new HttpException(
        '등록된 디바이스가 없습니다. 디바이스 등록을 진행해주세요.',
        HttpStatus.BAD_REQUEST,
      );

    const settings = await this.supportRepository.findSettings(user.id, currentDevice.id);

    if (settings) {
      Object.assign(settings, settingsData);
      await this.supportRepository.saveSettings(settings);
    } else {
      const newSettings = await this.supportRepository.createAlertSettings(
        settingsData,
        user.id,
        currentDevice.id,
      );
      await this.supportRepository.saveSettings(newSettings);
    }
  }

  async fetchSettingEntityById(userId: number, deviceId: number) {
    return await this.supportRepository.findSettings(userId, deviceId);
  }

  @Transactional()
  async registerDevice(req: ExpressRequest, uid: string, fcmToken: string) {
    const user = await this.userService.fetchUserEntityById(req.user.id);

    let device = await this.findDevice(user, req.device);

    if (device) {
      device.uid = uid;
      device.fcmToken = fcmToken;
    } else {
      device = await this.supportRepository.createDevice(
        user,
        {
          os: req.device.os as DeviceOS,
          type: req.device.type as DeviceType,
          model: req.device.model,
        },
        uid,
        fcmToken,
      );
    }

    await this.supportRepository.saveDevice(device);
    await this.redis.del(`user:${req.user.id}`);
  }

  async findDevice(user: User, reqDevice: DeviceDto) {
    return user.devices.length === 0
      ? null
      : user.devices.find(
          (device: Device) =>
            device.os === reqDevice.os &&
            device.type === reqDevice.type &&
            device.model === reqDevice.model,
        );
  }

  async newCreateDevice(user: User, device: DeviceDto) {
    const newDevice = await this.supportRepository.createDevice(user, {
      os: device.os as DeviceOS,
      type: device.type as DeviceType,
      model: device.model,
    });

    return await this.supportRepository.saveDevice(newDevice);
  }

  async getDevicesByUserId(userId: number) {
    return await this.supportRepository.findDevices(userId);
  }

  @Transactional()
  async deleteDevice(userId: number) {
    return await this.supportRepository.deleteDevice(userId);
  }

  async findAllVersions() {
    return await this.supportRepository.findAllVersions();
  }

  async getVersions() {
    const foundVersions = await this.findAllVersions();

    const versionMap = foundVersions.reduce((map, version) => {
      map[version.appType] = version.version;
      return map;
    }, {});

    const versions = this.utilsService.transformToDto(VersionsSummaryResDto, versionMap);
    return { versions: versions };
  }

  @Transactional()
  async updateAppVersion(versionId: number, version: string) {
    const foundVersion = await this.supportRepository.findVersion(versionId);
    if (!foundVersion)
      throw new HttpException('Please check the version ID', HttpStatus.BAD_REQUEST);

    foundVersion.version = version;

    await this.supportRepository.saveVersion(foundVersion);
  }

  @Transactional()
  async checkNewNotices(userId: number) {
    const latestNotice = await this.supportRepository.findLatestNotice();

    if (!latestNotice) return { newNotice: null };

    let seenNotice = await this.supportRepository.findSeenNotice(userId);

    if (!seenNotice) {
      seenNotice = await this.supportRepository.createSeenNotice(userId, latestNotice);
      await this.supportRepository.saveSeenNotice(seenNotice);
      return { newNotice: latestNotice.id };
    } else if (seenNotice.notice.id < latestNotice.id) {
      seenNotice.notice = latestNotice;
      await this.supportRepository.saveSeenNotice(seenNotice);
      return { newNotice: latestNotice.id };
    }

    return { newNotice: null };
  }
}
