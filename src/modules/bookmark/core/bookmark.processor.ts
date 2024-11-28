import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { BookmarkService } from './bookmark.service';
import { Bookmark } from '../../../entities/bookmark.entity';
import { DataSource } from 'typeorm';

@Processor('bookmark')
export class BookmarkProcessor {
  constructor(
    private readonly bookmarkService: BookmarkService,
    private readonly dataSource: DataSource,
  ) {}

  @Process({ name: 'resetBookmarks', concurrency: 1 })
  async handleResetBookmarks(job: Job<{ batch: Bookmark[] }>) {
    console.log('Processing resetBookmarks job:', job.id);

    const { batch } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.bookmarkService.handleResetBookmarks(batch);
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
