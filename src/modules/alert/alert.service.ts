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

  async createAndSendAlerts(reports: ReportQueue[], type: ActionType) {
    await this.alertQueue.add('createAndSendAlerts', { reports, type });
  }

  async processAlerts(reports: ReportQueue[], type: ActionType) {
    for (const report of reports) {
      const user = await this.userService.fetchUserEntityById(report.reporter.id);

      await this.createProcessedAlert(user, report, type);

      await this.fcmService.sendPushAlert(
        user.deviceToken,
        '처리 결과 푸쉬 알림',
        '대충 확인하라는 문구.',
      );
    }
  }

  async createProcessedAlert(user: User, report: ReportQueue, type: ActionType) {
    const alert = new Alert();
    const koreanDate = this.utilsService.formatDateToKorean(report.createdDate);
    let contentEnd: string;
    let result: string;

    if (report.essay.status === EssayStatus.PUBLISHED && type === ActionType.APPROVED) {
      contentEnd = `비공개 처리되었습니다.`;
      result = '비공개';
    } else if (report.essay.status === EssayStatus.LINKEDOUT && type === ActionType.APPROVED) {
      contentEnd = '삭제되었습니다.';
      result = '삭제';
    } else {
      contentEnd = '처리되지 않았습니다.';
    }

    const approvedBody = `해당 글을 컴도 결과 커뮤니티 가이드라인을 위반하는 콘텐츠를 포함하고 있어 ${result}되었습니다. 신고해주셔서 감사합니다!`;
    const rejectBody = `저희는 커뮤니티 가이드라인을 바탕으로 콘텐츠를 검토하고 있습니다. 해당 글을 검토한 결과 위반사항이 없음으로 별도의 조치가 취해지지 않습니다.`;

    alert.user = user;
    alert.title = `${koreanDate}에 요청하신 지원에 대한 내용이 업데이트 됐어요.`;
    alert.content = `${koreanDate}에 신고하신 게시물이 ${contentEnd}`;
    alert.body = type === ActionType.APPROVED ? approvedBody : rejectBody;
    alert.type = AlertType.UPDATED;

    return this.alertRepository.saveAlert(alert);
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
    const title = '이리오너라!';
    const body = `"${essay.title}" 이라는 제목의 에세이가 처음으로 조회되었습니다.`;

    const devices = await this.supportService.getDevices(essay.author.id);

    for (const device of devices) {
      const alertSettings = await this.supportService.fetchSettingEntityById(
        essay.author.id,
        device.deviceId,
      );
      if (alertSettings.viewed && this.utilsService.isWithinAllowedTime(alertSettings)) {
        await this.fcmService.sendPushAlert(device.deviceToken, title, body);
      }
    }
  }

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
}
