import { Notice } from '../../../../../entities/notice.entity';
import { Inquiry } from '../../../../../entities/inquiry.entity';
import { Release } from '../../../../../entities/release.entity';
import { UpdateAlertSettingsReqDto } from '../dto/request/updateAlertSettings.dto';
import { AlertSettings } from '../../../../../entities/alertSettings.entity';
import { User } from '../../../../../entities/user.entity';
import { DeviceDto } from '../dto/device.dto';
import { Device } from '../../../../../entities/device.entity';
import { AppVersions } from '../../../../../entities/appVersions.entity';
import { SeenNotice } from '../../../../../entities/seenNotice.entity';
import { SeenRelease } from '../../../../../entities/seenRelease.entity';
import { DeleteResult, UpdateResult } from 'typeorm';

export interface ISupportRepository {
  saveNotice(newNotice: Notice): Promise<Notice>;

  findNotice(noticeId: number): Promise<Notice>;

  findNotices(page: number, limit: number): Promise<{ notices: Notice[]; total: number }>;

  saveInquiry(newInquiry: Inquiry): Promise<Inquiry>;

  findInquiries(userId: number): Promise<Inquiry[]>;

  findAdminInquiries(
    page: number,
    limit: number,
    status: 'all' | 'unprocessed',
  ): Promise<{ inquiries: Inquiry[]; total: number }>;

  findInquiry(userId: number, inquiryId: number): Promise<Inquiry>;

  findUnprocessedInquiry(): Promise<Inquiry[]>;

  findInquiryById(inquiryId: number): Promise<Inquiry>;

  saveRelease(newRelease: Release): Promise<Release>;

  deleteRelease(releaseId: number): Promise<DeleteResult>;

  findReleases(page: number, limit: number): Promise<{ releases: Release[]; total: number }>;

  findRelease(releaseId: number): Promise<Release>;

  findPublicReleases(page: number, limit: number): Promise<{ releases: Release[]; total: number }>;

  createAlertSettings(
    data: UpdateAlertSettingsReqDto,
    userId: number,
    deviceId: number,
  ): Promise<AlertSettings>;

  findSettings(userId: number, deviceId: number): Promise<AlertSettings>;

  saveSettings(settings: AlertSettings): Promise<AlertSettings>;

  findDevice(deviceId: number): Promise<Device>;

  createDevice(
    user: User,
    currentDevice: DeviceDto,
    uid?: string,
    fcmToken?: string,
  ): Promise<Device>;

  saveDevice(device: Device): Promise<Device>;

  findDevices(userId: number): Promise<Device[]>;

  deleteDevice(userId: number): Promise<UpdateResult>;

  deleteAllDevice(): Promise<DeleteResult>;

  findAllVersions(): Promise<AppVersions[]>;

  findVersion(versionId: number): Promise<AppVersions>;

  saveVersion(version: AppVersions): Promise<AppVersions>;

  findLatestNotice(): Promise<Notice>;

  findSeenNotice(userId: number): Promise<SeenNotice>;

  createSeenNotice(userId: number, latestNotice: Notice): Promise<SeenNotice>;

  saveSeenNotice(seenNotice: SeenNotice): Promise<SeenNotice>;

  findLatestRelease(): Promise<Release>;

  findSeenRelease(userId: number): Promise<SeenRelease>;

  createSeenRelease(userId: number): Promise<SeenRelease>;

  saveSeenRelease(seenRelease: SeenRelease): Promise<SeenRelease>;
}
