import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { EssayService } from '../essay/essay.service';
import { CreateReportReqDto } from './dto/request/createReportReq.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
  ) {}

  async getReportByReporter(userId: number, essayId: number) {
    return this.reportRepository.findReportByReporter(userId, essayId);
  }

  @Transactional()
  async createReport(userId: number, essayId: number, data: CreateReportReqDto) {
    const essay = await this.essayService.getEssayById(essayId);

    if (!essay) {
      throw new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (essay.status === 'private') {
      throw new HttpException('비공개 에세이는 신고할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const existingReport = await this.reportRepository.findReportByReporter(userId, essayId);

    if (existingReport) {
      throw new HttpException('귀하는 이미 이 에세이를 신고했습니다.', HttpStatus.CONFLICT);
    }

    const report = new ReportQueue();
    report.reason = data.reason;
    report.reporter = { id: userId } as User;
    report.essay = { id: essayId } as Essay;
    report.processed = false;

    await this.reportRepository.saveReport(report);
  }
}
