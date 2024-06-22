import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EssayService } from '../essay/essay.service';
import { forwardRef, Inject } from '@nestjs/common';

@Processor('user')
export class UserProcessor {
  constructor(
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
  ) {}

  @Process('updateEssayStatus')
  async handleUpdateEssayStatus(job: Job<{ userIds: number[] }>) {
    console.log('Processing updateEssayStatus job:', job.id);
    const { userIds } = job.data;
    const batchSize = 10;
    const delayBetweenBatches = 3000;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      await this.essayService.handleUpdateEssayStatus(batch);

      if (i + batchSize < userIds.length) {
        await this.sleep(delayBetweenBatches);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
