import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { DataSource } from 'typeorm';

import { AlertService } from './alert.service';
import { ActionType } from '../../../../../common/types/enum.types';
import { ReportQueue } from '../../../../../entities/reportQueue.entity';

@Processor('alert')
export class AlertProcessor {
  constructor(
    private readonly alertService: AlertService,
    private readonly dataSource: DataSource,
  ) {}

  @Process({ name: 'createAndSendReportProcessedAlerts', concurrency: 1 })
  async handleCreateAndSendAlerts(job: Job<{ batch: ReportQueue[]; type: ActionType }>) {
    console.log('Processing createAndSendAlerts job:', job.id);

    const { batch, type } = job.data;
    console.log(`Job data: ${JSON.stringify(job.data)}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.alertService.processReportAlerts(batch, type);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Error processing batch:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
