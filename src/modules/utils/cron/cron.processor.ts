import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EssayService } from '../../base/essay/essay.service';
import { forwardRef, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Essay } from '../../../entities/essay.entity';
import { Aggregate } from '../../../entities/aggregate.entity';
import { User } from '../../../entities/user.entity';

@Processor('{cron}cron')
export class CronProcessor {
  constructor(
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
    private readonly dataSource: DataSource,
  ) {}

  @Process({ name: 'updateEssayStatus', concurrency: 1 })
  async handleUpdateEssayStatus(job: Job<{ batch: number[] }>) {
    console.log('Processing updateEssayStatus job:', job.id);
    const { batch } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
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

  @Process({ name: 'syncAggregates', concurrency: 1 })
  async handleSyncJob(job: Job) {
    const { aggregates } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateEssayPromises = aggregates.map((aggregate: Aggregate) =>
        queryRunner.manager.update(
          Essay,
          { id: aggregate.essayId },
          {
            views: aggregate.totalViews,
            trendScore: aggregate.trendScore,
          },
        ),
      );

      const updateUserPromises = aggregates.map((aggregate: Aggregate) =>
        queryRunner.manager
          .createQueryBuilder()
          .update(User)
          .set({
            reputation: () => `"reputation" + ${aggregate.reputationScore}`,
          })
          .where('id = :id', { id: aggregate.userId })
          .execute(),
      );

      await Promise.all([...updateEssayPromises, ...updateUserPromises]);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(`Sync job failed: ${job.id}`, error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
