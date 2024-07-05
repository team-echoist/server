import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AdminService } from './admin.service';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReportQueue } from '../../entities/reportQueue.entity';

@Processor('admin')
export class AdminProcessor {
  constructor(private readonly adminService: AdminService) {}

  @Process('syncReportsProcessed')
  async handleSyncReportsProcessed(
    job: Job<{ reports: ReportQueue[]; adminId: number; data: ProcessReqDto }>,
  ) {
    console.log('Processing syncReportsProcessed job:', job.id);

    const { reports, adminId, data } = job.data;
    console.log(`Job data: ${JSON.stringify(job.data)}`);
    const batchSize = 10;
    const delayBetweenBatches = 3000;

    for (let i = 0; i < reports.length; i += batchSize) {
      const batch = reports.slice(i, i + batchSize);
      console.log(`Processing batch: ${JSON.stringify(batch)}`);

      try {
        await this.adminService.processBatchReports(batch, adminId, data);
      } catch (error) {
        console.error('Error processing batch:', error);
      }

      if (i + batchSize < reports.length) {
        await this.sleep(delayBetweenBatches);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
