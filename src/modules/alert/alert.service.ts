import { Injectable } from '@nestjs/common';
import { AlertRepository } from './alert.repository';
import { Essay } from '../../entities/essay.entity';
import { Alert, AlertType } from '../../entities/alert.entity';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class AlertService {
  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly utilsService: UtilsService,
  ) {}

  async createEssayAlert(essay: Essay) {
    const titles = [
      `다른 아무개가 ${essay.author.nickname} 아무개님의 글을 찾았어요!`,
      `다른 아무개가 ${essay.author.nickname} 아무개님의 글을 발견!`,
      `다른 아무개가 ${essay.author.nickname} 아무개님의 글을 읽고있어요.`,
      `다른 아무개가 ${essay.author.nickname} 아무개님의 글을 정독 중이에요.`,
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const title = `다른 아무개가 ${essay.author.nickname} 아무개님의 '${essay.title}'글을 ${randomTitle}`;

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
}
