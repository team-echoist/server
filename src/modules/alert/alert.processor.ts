import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AlertService } from './alert.service';
import { ActionType } from '../../entities/processedHistory.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';

@Processor('alert')
export class AlertProcessor {
  constructor(private readonly alertService: AlertService) {}

  @Process('createAndSendReportProcessedAlerts')
  async handleCreateAndSendAlerts(job: Job<{ reports: ReportQueue[]; type: ActionType }>) {
    console.log('Processing createAndSendAlerts job:', job.id);

    const { reports, type } = job.data;
    console.log(`Job data: ${JSON.stringify(job.data)}`);
    const batchSize = 10;
    const delayBetweenBatches = 3000;

    for (let i = 0; i < reports.length; i += batchSize) {
      const batch = reports.slice(i, i + batchSize);
      console.log(`Processing batch: ${JSON.stringify(batch)}`);

      try {
        await this.alertService.processReportAlerts(batch, type);
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
