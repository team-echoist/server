import { ReportQueue } from '../../../../../entities/reportQueue.entity';

export interface IReporter {
  findReportByReporter(userId: number, essayId: number): Promise<ReportQueue>;

  saveReport(report: ReportQueue): Promise<ReportQueue>;
}
