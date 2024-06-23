import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CronLog } from '../../entities/cronLog.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(CronLog)
    private readonly cronLogRepository: Repository<CronLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue('cron') private readonly cronQueue: Queue,
  ) {}

  async logStart(taskName: string): Promise<number> {
    const log = this.cronLogRepository.create({ taskName, status: 'started' });
    const savedLog = await this.cronLogRepository.save(log);
    return savedLog.id;
  }

  async logEnd(id: number, status: string, message: string): Promise<void> {
    await this.cronLogRepository.update(id, { endTime: new Date(), status, message });
  }

  async startCronJobs() {
    cron.schedule('0 5 * * *', async () => {
      const logId = await this.logStart('deactivate_users_and_update_essays');
      try {
        await this.deactivateUsersAndQueueEssays();
        await this.logEnd(logId, 'completed', 'Batch processing completed successfully.');
        this.logger.log('Batch processing completed successfully.');
      } catch (error) {
        await this.logEnd(logId, 'failed', error.message);
        this.logger.error('Batch processing failed.', error);
      }
    });
  }

  async deactivateUsersAndQueueEssays() {
    const logId = await this.logStart('deactivate_users_and_queue_essays');
    try {
      const todayDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const users = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id'])
        .where('deactivation_date <= :date', {
          date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        })
        .andWhere('deleted_date IS NULL')
        .getMany();

      const userIds = users.map((user) => user.id);

      if (userIds.length > 0) {
        await this.cronQueue.add('updateEssayStatus', { userIds });
      }

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          email: () => `CONCAT('${todayDate}_', email)`,
          nickname: null,
          deletedDate: () => `NOW()`,
        })
        .where('id IN (:...userIds)', { userIds })
        .execute();

      await this.logEnd(
        logId,
        'completed',
        'Users deactivated and essays queued for status update.',
      );
      this.logger.log('Users deactivated and essays queued for status update.');
    } catch (error) {
      await this.logEnd(logId, 'failed', error.message);
      this.logger.error('Failed to deactivate users and queue essays for status update.', error);
    }
  }
}
