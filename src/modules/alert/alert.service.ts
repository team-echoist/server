import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AlertRepository } from './alert.repository';
import { Essay } from '../../entities/essay.entity';
import { Alert, AlertType } from '../../entities/alert.entity';
import { UtilsService } from '../utils/utils.service';
import { AlertResDto } from './dto/response/alertRes.dto';

@Injectable()
export class AlertService {
  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly utilsService: UtilsService,
  ) {}

  async createEssayAlert(essay: Essay) {
    const ends = [`찾았어요!`, `발견!`, `읽고있어요.`, `정독 중이에요.`];
    const randomEnd = ends[Math.floor(Math.random() * ends.length)];

    const title = `다른 아무개가 ${essay.author.nickname} 아무개님의 '${essay.title}'글을 ${randomEnd}`;

    const createdDate = new Date(essay.createdDate);
    const koreanFormatter = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
    const koreanDate = koreanFormatter.format(createdDate);

    const alert = new Alert();

    alert.user = essay.author;
    alert.title = title;
    alert.content = this.utilsService.extractPartContent(essay.content);
    alert.body = `"로 시작하는 글, 기억하시나요?\n${koreanDate}에\n링크드아웃한 글이 발견됐어요.`;

    essay.status === 'published'
      ? (alert.type = AlertType.PUBLISHED)
      : (alert.type = AlertType.LINKEDOUT);

    return this.alertRepository.saveAlert(alert);
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
