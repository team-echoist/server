import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { BookmarkService } from './bookmark.service';
import { Bookmark } from '../../entities/bookmark.entity';

@Processor('bookmark')
export class BookmarkProcessor {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Process('resetBookmarks')
  async handleResetBookmarks(job: Job<{ bookmarks: Bookmark[] }>) {
    console.log('Processing resetBookmarks job:', job.id);

    const { bookmarks } = job.data;
    const batchSize = 10;
    const delayBetweenBatches = 3000;

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);

      await this.bookmarkService.handleResetBookmarks(batch);

      if (i + batchSize < bookmarks.length) {
        await this.sleep(delayBetweenBatches);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
