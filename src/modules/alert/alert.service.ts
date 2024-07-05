import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AlertRepository } from './alert.repository';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { Alert, AlertType } from '../../entities/alert.entity';
import { UtilsService } from '../utils/utils.service';
import { AlertResDto } from './dto/response/alertRes.dto';
import { SupportService } from '../support/support.service';
import { FcmService } from '../fcm/fcm.service';
import { ActionType } from '../../entities/processedHistory.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserService } from '../user/user.service';
import { User } from '../../entities/user.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';

@Injectable()
export class AlertService {
  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly utilsService: UtilsService,
    private readonly supportService: SupportService,
    private readonly fcmService: FcmService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectQueue('alert') private readonly alertQueue: Queue,
  ) {}

  async hasUnreadAlerts(userId: number) {
    const result = await this.alertRepository.countingAlert(userId);

    return result > 0;
  }

  async getAlerts(userId: number, page: number, limit: number) {
    const { alerts, total } = await this.alertRepository.findAlerts(userId, page, limit);

    const totalPage: number = Math.ceil(total / limit);
    const alertsDto = this.utilsService.transformToDto(AlertResDto, alerts);

    return { alerts: alertsDto, total, page, totalPage };
  }

  async markAlertAsRead(userId: number, alertId: number) {
    const alert = await this.alertRepository.findAlert(userId, alertId);

    if (!alert) throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);

    alert.read = true;
    await this.alertRepository.saveAlert(alert);
  }

  async createAndSendReportProcessedAlerts(reports: ReportQueue[], type: ActionType) {
    await this.alertQueue.add(`createAndSendReportProcessedAlerts`, { reports, type });
  }

  async processReportAlerts(reports: ReportQueue[], type: ActionType) {
    for (const report of reports) {
      const user = await this.userService.fetchUserEntityById(report.reporter.id);

      await this.createReportProcessedAlert(user, report, type);

      const devices = await this.supportService.getDevices(report.reporter.id);
      if (!devices && devices.length === 0) return;

      for (const device of devices) {
        const alertSettings = await this.supportService.fetchSettingEntityById(
          report.reporter.id,
          device.deviceId,
        );
        if (alertSettings.report)
          await this.fcmService.sendPushAlert(
            user.deviceToken,
            '신고 결과를 알려드릴려고 왔어요!',
            '요청하신 지원에 대한 업데이트가 있어요.',
          );
      }
    }
  }

  MESSAGE_TEMPLATES = {
    approvedBody: (result: string) =>
      `해당 글을 검토한 결과 커뮤니티 가이드라인을 위반하는 콘텐츠를 포함하고 있어 ${result}되었습니다. 신고해주셔서 감사합니다!`,
    rejectBody:
      '저희는 커뮤니티 가이드라인을 바탕으로 콘텐츠를 검토하고 있습니다. 해당 글을 검토한 결과 위반 사항이 없어 별도의 조치가 취해지지 않습니다.',
    contentEnd: {
      [EssayStatus.PUBLISHED]: '비공개 처리되었습니다.',
      [EssayStatus.LINKEDOUT]: '삭제되었습니다.',
      default: '처리되지 않았습니다.',
    },
    result: {
      [EssayStatus.PUBLISHED]: '비공개 처리',
      [EssayStatus.LINKEDOUT]: '삭제',
      default: '',
    },
  };

  async createReportProcessedAlert(user: User, report: ReportQueue, type: ActionType) {
    const alert = new Alert();
    const koreanDate = this.utilsService.formatDateToKorean(report.createdDate);

    const contentEnd = this.getContentEnd(report.essay.status, type);
    const result = this.getResult(report.essay.status, type);
    const body = this.getAlertBody(type, result);

    alert.user = user;
    alert.title = `${koreanDate}에 요청하신 지원에 대한 내용이 업데이트 되었습니다.`;
    alert.content = `${koreanDate}에 신고하신 게시물이 ${contentEnd}`;
    alert.body = body;
    alert.type = AlertType.SUPPORT;

    return this.alertRepository.saveAlert(alert);
  }

  private getContentEnd(status: EssayStatus, type: ActionType): string {
    if (type === ActionType.APPROVED) {
      return this.MESSAGE_TEMPLATES.contentEnd[status] || this.MESSAGE_TEMPLATES.contentEnd.default;
    }
    return this.MESSAGE_TEMPLATES.contentEnd.default;
  }

  private getResult(status: EssayStatus, type: ActionType): string {
    if (type === ActionType.APPROVED) {
      return this.MESSAGE_TEMPLATES.result[status] || this.MESSAGE_TEMPLATES.result.default;
    }
    return this.MESSAGE_TEMPLATES.result.default;
  }

  private getAlertBody(type: ActionType, result: string): string {
    if (type === ActionType.APPROVED) {
      return this.MESSAGE_TEMPLATES.approvedBody(result);
    }
    return this.MESSAGE_TEMPLATES.rejectBody;
  }

  async createReportResultAlerts(essay: Essay) {
    const alert = new Alert();
    const koreanDate = this.utilsService.formatDateToKorean(essay.createdDate);

    alert.user = await this.userService.fetchUserEntityById(essay.author.id);
    alert.title = `${koreanDate}에 작성하신 게시물이 업데이트 됐어요.`;
    alert.content = `${koreanDate}에 작성하신 게시물이 비공개 처리되었습니다.`;
    alert.body =
      '해당 글에 대한 신고 발생으로 인해, 커뮤니티 가이드라인을 바탕으로 콘텐츠를 검토한 결과 비공개 처리되었습니다.';
    alert.type = AlertType.SUPPORT;

    return this.alertRepository.saveAlert(alert);
  }

  async sendPushAlertReportProcessed(essay: Essay) {
    const devices = await this.supportService.getDevices(essay.author.id);
    if (!devices && devices.length === 0) return;

    for (const device of devices) {
      const alertSettings = await this.supportService.fetchSettingEntityById(
        essay.author.id,
        device.deviceId,
      );
      if (alertSettings.report)
        await this.fcmService.sendPushAlert(
          device.deviceToken,
          `$작성하신 글에 대한 업데이트가 있어요.`,
          `발행하신 글이 검토 후 비공개 상태로 전환됐어요.`,
        );
    }
  }

  async createReviewAlerts(essay: Essay, status: EssayStatus) {
    const alert = new Alert();
    const koreanDate = this.utilsService.formatDateToKorean(essay.createdDate);

    alert.user = essay.author;
    alert.title = `${koreanDate}에 ${status} 요청하신 글에 대한 내용이 업데이트 됐어요.`;
    alert.content = `${koreanDate}에 작성하신 "${essay.title}" 게시물이 비공개 처리되었습니다.`;
    alert.body = `해당 글이 커뮤니티 가이드라인을 준수하는지 검토 후 알려드릴게요!`;
    alert.type = AlertType.SUPPORT;

    return this.alertRepository.saveAlert(alert);
  }

  async sendPushReviewAlert(essay: Essay) {
    const devices = await this.supportService.getDevices(essay.author.id);
    if (!devices && devices.length === 0) return;

    for (const device of devices) {
      const alertSettings = await this.supportService.fetchSettingEntityById(
        essay.author.id,
        device.deviceId,
      );
      if (alertSettings.report)
        await this.fcmService.sendPushAlert(
          device.deviceToken,
          '작성하신 글에 대한 업데이트가 있어요.',
          `발행 또는 링크드아웃하신 글이 검토 후 공개될 예정이에요.`,
        );
    }
  }

  async createReviewResultAlert(review: ReviewQueue, actionType: string) {
    const alert = new Alert();
    const req = review.type === 'published' ? '발행' : '링크드아웃';
    const koreanDate = this.utilsService.formatDateToKorean(review.essay.createdDate);

    alert.user = await this.userService.fetchUserEntityById(review.user.id);
    alert.title = `${koreanDate}에 작성하신 글에 대한 내용이 업데이트 됐어요.`;
    alert.content =
      actionType === ActionType.APPROVED
        ? `${koreanDate}에 작성하신 게시물이 공개처리되었습니다.`
        : `${koreanDate}에 작성하신 게시물이 보류 처리되었습니다.`;
    alert.body =
      actionType === ActionType.APPROVED
        ? `해당 글은 검토 결과 커뮤니티 가이드라인에 따라 공개 처리되었음을 알려드립니다. 기다려주셔서 감사합니다.`
        : `해당 글은 검토 결과 커뮤니티 가이드라인을 위반하는 콘텐츠를 포함하고 있어 비공개 처리되었습니다.`;
    alert.type = AlertType.SUPPORT;

    return this.alertRepository.saveAlert(alert);
  }

  async sendPushReviewResultAlert(userId: number, actionType: string) {
    const devices = await this.supportService.getDevices(userId);
    if (!devices && devices.length === 0) return;

    const result = actionType === ActionType.APPROVED ? '공개' : '보류';
    const body = `발행 또는 링크드아웃하신 글이 검토 후 ${result} 상태로 전환됐어요.`;

    for (const device of devices) {
      const alertSettings = await this.supportService.fetchSettingEntityById(
        userId,
        device.deviceId,
      );
      if (alertSettings.report)
        await this.fcmService.sendPushAlert(
          device.deviceToken,
          `작성하신 글에 대한 업데이트가 있어요.`,
          body,
        );
    }
  }

  async createAlertFirstView(essay: Essay) {
    const ends = [`찾았어요!`, `발견!`, `읽고있어요.`, `정독 중이에요.`];
    const randomEnd = ends[Math.floor(Math.random() * ends.length)];

    const createdDate = new Date(essay.createdDate);
    const koreanDate = this.utilsService.formatDateToKorean(createdDate);

    const alert = new Alert();

    alert.user = essay.author;
    alert.title = `다른 아무개가 ${essay.author.nickname} 아무개님의 '${essay.title}'글을 ${randomEnd}`;
    alert.content = this.utilsService.extractPartContent(essay.content);
    alert.body = `"로 시작하는 글, 기억하시나요?\n${koreanDate}에\n링크드아웃한 글이 발견됐어요.`;

    essay.status === 'published'
      ? (alert.type = AlertType.PUBLISHED)
      : (alert.type = AlertType.LINKEDOUT);

    return this.alertRepository.saveAlert(alert);
  }

  async sendPushAlertFirstView(essay: Essay) {
    const devices = await this.supportService.getDevices(essay.author.id);
    if (!devices && devices.length === 0) return;

    for (const device of devices) {
      const alertSettings = await this.supportService.fetchSettingEntityById(
        essay.author.id,
        device.deviceId,
      );
      if (alertSettings.viewed)
        await this.fcmService.sendPushAlert(
          device.deviceToken,
          `다른 아무개가 ${essay.author.nickname} 아무개님의 글을 발견!`,
          `사람들이 ${essay.author.nickname} 아무개님의 이야기를 읽기 시작했어요!`,
        );
    }
  }
}
