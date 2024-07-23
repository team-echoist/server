import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { AdminService } from './admin.service';
import { ProcessReqDto } from './dto/request/processReq.dto';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { DataSource } from 'typeorm';

@Processor('admin')
export class AdminProcessor {
  constructor(
    private readonly adminService: AdminService,
    private readonly dataSource: DataSource,
  ) {}

  @Process({ name: 'syncReportsProcessed', concurrency: 1 })
  async handleSyncReportsProcessed(
    job: Job<{ batch: ReportQueue[]; adminId: number; data: ProcessReqDto }>,
  ) {
    console.log('Processing syncReportsProcessed job:', job.id);

    const { batch } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.adminService.processBatchReports(batch, job.data.adminId, job.data.data);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(`Batch failed: ${batch}`, error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
