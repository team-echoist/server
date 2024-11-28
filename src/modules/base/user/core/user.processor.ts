import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EssayService } from '../../essay/core/essay.service';
import { forwardRef, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Processor('user')
export class UserProcessor {
  constructor(
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
    private readonly dataSource: DataSource,
  ) {}

  @Process({ name: 'deleteAccountEssaySync', concurrency: 1 })
  async handleUpdateEssayStatusBatch(job: Job<{ batch: number[] }>) {
    console.log('Processing deleteAccountEssaySync job:', job.id);
    const { batch } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.essayService.handleUpdateEssayStatus(batch);
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
