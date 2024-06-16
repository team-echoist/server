import { Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async getReportByReporter(userId: number, essayId: number) {
    return this.reportRepository.findReportByReporter(userId, essayId);
  }

  async createReport(userId: number, essayId: number, reason: string) {
    const report = new ReportQueue();
    report.reason = reason;
    report.reporter = { id: userId } as User;
    report.essay = { id: essayId } as Essay;
    report.processed = false;

    await this.reportRepository.saveReport(report);
  }
}
