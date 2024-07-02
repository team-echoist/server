import { forwardRef, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class SupportService {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly supportRepository: SupportRepository,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
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
  async getSettings(userId: number, deviceId?: string) {
    let settings = await this.supportRepository.findSettings(userId, deviceId);

    if (!settings) {
      settings = new AlertSettings();
      settings.user = await this.userService.fetchUserEntityById(userId);
      settings.deviceId = deviceId ? deviceId : null;

      await this.supportRepository.saveSettings(settings);
    }

    return this.utilsService.transformToDto(AlertSettingsResDto, settings);
  }

  async fetchSettingEntityById(userId: number, deviceId: string) {
    return await this.supportRepository.findSettings(userId, deviceId);
  }

  async updateSettings(userId: number, settingsData: UpdateAlertSettingsReqDto, deviceId: string) {
    const settings = await this.supportRepository.findSettings(userId, deviceId);
    if (settings) {
      Object.assign(settings, settingsData);
      await this.supportRepository.saveSettings(settings);
    } else {
      const newSettings = await this.supportRepository.createAlertSettings(settingsData, userId);
      await this.supportRepository.saveSettings(newSettings);
    }
  }

  async registerDevice(userId: number, deviceId: string, deviceToken: string) {
    const user = await this.userService.fetchUserEntityById(userId);
    let device = await this.supportRepository.findDevice(deviceId);

    device
      ? (device.deviceToken = deviceToken)
      : (device = await this.supportRepository.createDevice(user, deviceId, deviceToken));

    return await this.supportRepository.saveDevice(device);
  }

  async getDevices(userId: number) {
    return await this.supportRepository.findDevices(userId);
  }
}
