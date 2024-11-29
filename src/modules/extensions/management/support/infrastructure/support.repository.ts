import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ISupportRepository } from './isupport.repository';
import { DeviceOS, DeviceType } from '../../../../../common/types/enum.types';
import { AlertSettings } from '../../../../../entities/alertSettings.entity';
import { AppVersions } from '../../../../../entities/appVersions.entity';
import { Device } from '../../../../../entities/device.entity';
import { Inquiry } from '../../../../../entities/inquiry.entity';
import { Notice } from '../../../../../entities/notice.entity';
import { Release } from '../../../../../entities/release.entity';
import { SeenNotice } from '../../../../../entities/seenNotice.entity';
import { SeenRelease } from '../../../../../entities/seenRelease.entity';
import { User } from '../../../../../entities/user.entity';
import { DeviceDto } from '../dto/device.dto';
import { UpdateAlertSettingsReqDto } from '../dto/request/updateAlertSettings.dto';

export class SupportRepository implements ISupportRepository {
  constructor(
    @InjectRepository(Inquiry) private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Notice) private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(SeenRelease) private readonly seenReleaseRepository: Repository<SeenRelease>,
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
    @InjectRepository(AlertSettings)
    private readonly alertSettingsRepository: Repository<AlertSettings>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(AppVersions)
    private readonly appVersionsRepository: Repository<AppVersions>,
    @InjectRepository(SeenNotice)
    private readonly seenNoticeRepository: Repository<SeenNotice>,
  ) {}

  async saveNotice(newNotice: Notice) {
    return this.noticeRepository.save(newNotice);
  }

  async findNotice(noticeId: number) {
    return this.noticeRepository.findOne({
      where: { id: noticeId },
      relations: ['processor'],
    });
  }

  async findNotices(page: number, limit: number) {
    const [notices, total] = await this.noticeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
    });

    return { notices, total };
  }

  async saveInquiry(newInquiry: Inquiry) {
    return this.inquiryRepository.save(newInquiry);
  }

  async findInquiries(userId: number) {
    return this.inquiryRepository.find({ where: { user: { id: userId } } });
  }

  async findAdminInquiries(page: number, limit: number, status: 'all' | 'unprocessed') {
    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.user', 'user')
      .orderBy('inquiry.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status === 'unprocessed') {
      queryBuilder.where('inquiry.processed = :processed', { processed: false });
    }

    const [inquiries, total] = await queryBuilder.getManyAndCount();

    return { inquiries, total };
  }

  async findInquiry(userId: number, inquiryId: number) {
    return this.inquiryRepository.findOne({ where: { user: { id: userId }, id: inquiryId } });
  }

  async findUnprocessedInquiry() {
    return this.inquiryRepository.find({ where: { processed: false } });
  }

  async findInquiryById(inquiryId: number) {
    return this.inquiryRepository.findOne({ where: { id: inquiryId }, relations: ['user'] });
  }

  async saveRelease(newRelease: Release) {
    return this.releaseRepository.save(newRelease);
  }

  async deleteRelease(releaseId: number) {
    return this.releaseRepository.delete(releaseId);
  }

  async findReleases(page: number, limit: number) {
    const [releases, total] = await this.releaseRepository.findAndCount({
      order: {
        createdDate: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['processor'],
    });

    return { releases, total };
  }

  async findRelease(releaseId: number) {
    return this.releaseRepository
      .createQueryBuilder('release')
      .leftJoinAndSelect('release.processor', 'processor')
      .where('release.id = :id', { id: releaseId })
      .getOne();
  }

  async findPublicReleases(page: number, limit: number) {
    const [releases, total] = await this.releaseRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return { releases, total };
  }

  async createAlertSettings(data: UpdateAlertSettingsReqDto, userId: number, deviceId: number) {
    return this.alertSettingsRepository.create({
      ...data,
      user: { id: userId },
      device: { id: deviceId },
    });
  }

  async findSettings(userId: number, deviceId: number) {
    return this.alertSettingsRepository.findOne({
      where: { user: { id: userId }, device: { id: deviceId } },
      relations: ['user', 'device'],
    });
  }

  async saveSettings(settings: AlertSettings) {
    return this.alertSettingsRepository.save(settings);
  }

  async findDevice(deviceId: number) {
    return this.deviceRepository.findOne({ where: { id: deviceId } });
  }

  async createDevice(user: User, currentDevice: DeviceDto, uid?: string, fcmToken?: string) {
    const newDevice = new Device();
    newDevice.user = user;
    newDevice.uid = uid ? uid : null;
    newDevice.fcmToken = fcmToken ? fcmToken : null;
    newDevice.os = currentDevice.os as DeviceOS;
    newDevice.type = currentDevice.type as DeviceType;
    newDevice.model = currentDevice.model;

    return newDevice;
  }

  async saveDevice(device: Device) {
    return this.deviceRepository.save(device);
  }

  async findDevices(userId: number) {
    return this.deviceRepository.find({ where: { user: { id: userId } } });
  }

  async deleteDevice(userId: number) {
    return this.deviceRepository
      .createQueryBuilder()
      .update(Device)
      .where('user_id = :userId', { userId })
      .execute();
  }

  async findAllVersions() {
    return this.appVersionsRepository.find();
  }

  async findVersion(versionId: number) {
    return this.appVersionsRepository.findOne({ where: { id: versionId } });
  }

  async saveVersion(version: AppVersions) {
    return this.appVersionsRepository.save(version);
  }

  async deleteAllDevice() {
    return this.deviceRepository.delete({});
  }

  async findLatestNotice() {
    const notices = await this.noticeRepository.find({
      order: { createdDate: 'DESC' },
      take: 1,
    });

    return notices.length > 0 ? notices[0] : null;
  }

  async findSeenNotice(userId: number) {
    return this.seenNoticeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['notice'],
    });
  }

  async createSeenNotice(userId: number, latestNotice: Notice) {
    return this.seenNoticeRepository.create({
      user: { id: userId },
      notice: latestNotice,
    });
  }

  async saveSeenNotice(seenNotice: SeenNotice) {
    return this.seenNoticeRepository.save(seenNotice);
  }

  async findLatestRelease() {
    return this.releaseRepository.findOne({ where: {}, order: { createdDate: 'DESC' } });
  }

  async findSeenRelease(userId: number) {
    return this.seenReleaseRepository.findOne({
      where: { user: { id: userId } },
      order: { lastChecked: 'DESC' },
    });
  }

  async createSeenRelease(userId: number) {
    return this.seenReleaseRepository.create({
      user: { id: userId },
      lastChecked: new Date(),
    });
  }

  async saveSeenRelease(seenRelease: SeenRelease) {
    return this.seenReleaseRepository.save(seenRelease);
  }
}
