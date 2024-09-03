import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CronLog } from '../../entities/cronLog.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Geulroquis } from '../../entities/geulroguis.entity';
import { Cron } from '@nestjs/schedule';
import { UtilsService } from '../utils/utils.service';
import { CronLogResDto } from './dto/response/cronLogRes.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Device } from '../../entities/device.entity';
import { UserStatus } from '../../common/types/enum.types';
import { EssayService } from '../essay/essay.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(CronLog)
    private readonly cronLogRepository: Repository<CronLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Geulroquis)
    private readonly geulroquisRepository: Repository<Geulroquis>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    @InjectQueue('{cron}cron')
    private readonly cronQueue: Queue,

    @InjectRedis() private readonly redis: Redis,

    private readonly utilsService: UtilsService,
    private readonly configService: ConfigService,
    private readonly essayService: EssayService,
  ) {}

  async getCronLogs(page: number, limit: number) {
    const [logs, total] = await this.cronLogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    const cronLogsDto = this.utilsService.transformToDto(CronLogResDto, logs);
    return { cronLogsDto, total, page };
  }

  private async logStart(taskName: string): Promise<number> {
    const log = this.cronLogRepository.create({ taskName, status: 'started' });
    const savedLog = await this.cronLogRepository.save(log);
    return savedLog.id;
  }

  private async logEnd(id: number, status: string, message: string): Promise<void> {
    await this.cronLogRepository.update(id, { endTime: new Date(), status, message });
  }

  @Cron('0 4 * * *')
  async userDeletionCronJobs() {
    const logId = await this.logStart('deactivate_users_and_update_essays');
    try {
      await this.deactivateUsersAndQueueEssays();
      await this.logEnd(logId, 'completed', 'Batch processing completed successfully.');
      this.logger.log('Batch processing completed successfully.');
    } catch (error) {
      await this.logEnd(logId, 'failed', error.message);
      this.logger.error('Batch processing failed.', error);
    }
  }

  private async deactivateUsersAndQueueEssays() {
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
        const batchSize = 10;
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize);
          await this.cronQueue.add(
            'updateEssayStatus',
            { batch },
            {
              attempts: 5,
              backoff: 5000,
              delay: i * 3000,
            },
          );
        }
      }
      if (userIds.length > 0) {
        await this.userRepository
          .createQueryBuilder()
          .update(User)
          .set({
            email: () => `CONCAT('${todayDate}_', email)`,
            nickname: null,
            status: UserStatus.DEACTIVATED,
            profileImage: this.configService.get<string>('DEFAULT_PROFILE_IMG'),
            deletedDate: () => `NOW()`,
          })
          .where('id IN (:...userIds)', { userIds })
          .execute();

        await this.deviceRepository
          .createQueryBuilder()
          .update(Device)
          .where('id In (:...userIds)', { userIds })
          .execute();

        await this.logEnd(
          logId,
          'completed',
          'Users deactivated and essays queued for status update.',
        );
        this.logger.log('Users deactivated and essays queued for status update.');
      }
    } catch (error) {
      await this.logEnd(logId, 'failed', error.message);
      this.logger.error('Failed to deactivate users and queue essays for status update.', error);
    }
  }

  @Cron('0 0 * * *')
  async updateNextGeulroquis() {
    if (!this.configService.get('APP_INITIALIZING')) {
      const logId = await this.logStart('update_next_geulroguis');
      try {
        const currentImage = await this.geulroquisRepository.findOne({ where: { current: true } });
        if (currentImage) {
          currentImage.provided = true;
          currentImage.providedDate = new Date();
          currentImage.current = false;
          await this.geulroquisRepository.save(currentImage);
        }

        const nextImage = await this.geulroquisRepository.findOne({ where: { next: true } });
        if (nextImage) {
          nextImage.current = true;
          nextImage.next = false;
          await this.geulroquisRepository.save(nextImage);
        } else {
          const nextImageInOrder = await this.geulroquisRepository.findOne({
            where: { provided: false },
            order: { id: 'ASC' },
          });
          if (nextImageInOrder) {
            nextImageInOrder.current = true;
            await this.geulroquisRepository.save(nextImageInOrder);
          }
        }
        const cacheKey = `today_geulroquis`;
        const todayGeulroquis = await this.geulroquisRepository.findOne({
          where: { current: true },
        });
        await this.redis.set(cacheKey, JSON.stringify(todayGeulroquis.url), 'EX', 24 * 60 * 60);

        await this.logEnd(logId, 'completed', '글로키 스케쥴링이 정상적으로 완료되었습니다.');
        this.logger.log('글로키 스케쥴링이 정상적으로 완료되었습니다.');
      } catch (error) {
        await this.logEnd(logId, 'failed', error.message);
        this.logger.error('글로키 스케쥴링이 실패하였습니다.', error);
      }
    }
  }

  @Cron('*/3 * * * *')
  async syncAggregateDataToMainTable() {
    const logId = await this.logStart('sync_aggregate_data');
    let batchOffset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const updatedAggregates = await this.essayService.findUpdatedAggregates(batchOffset, 100);

      if (updatedAggregates.length > 0) {
        await this.cronQueue.add('syncAggregates', { aggregates: updatedAggregates });
        batchOffset += 100;
      } else {
        hasMoreData = false;
      }
    }

    await this.logEnd(logId, 'completed', '집계 데이터 동기화가 성공적으로 완료되었습니다.');
  }
}
