import { Repository } from 'typeorm';
import { ReportQueue } from '../../../../../entities/reportQueue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IReporter } from './ireport.repository';

export class ReportRepository implements IReporter {
  constructor(
    @InjectRepository(ReportQueue)
    private readonly reportRepository: Repository<ReportQueue>,
  ) {}

  async findReportByReporter(userId: number, essayId: number) {
    return this.reportRepository.findOne({
      where: { reporter: { id: userId }, essay: { id: essayId } },
    });
  }

  async saveReport(report: ReportQueue) {
    return await this.reportRepository.save(report);
  }
}
