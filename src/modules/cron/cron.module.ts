import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { CronLog } from '../../entities/cronLog.entity';
import { CronService } from './cron.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeactivationReason } from '../../entities/deactivationReason.entity';
import { EssayModule } from '../essay/essay.module';
import { CronProcessor } from './cron.processor';
import { Geulroquis } from '../../entities/geulroguis.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from '../utils/utils.module';
import { Device } from '../../entities/device.entity';
import { SyncStatus } from '../../entities/sysncStatus.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Essay,
      CronLog,
      DeactivationReason,
      Geulroquis,
      Device,
      SyncStatus,
    ]),
    ScheduleModule.forRoot(),
    BullModule.registerQueueAsync({
      name: 'cron',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    EssayModule,
    UtilsModule,
    EssayModule,
  ],
  providers: [CronService, CronProcessor],
  exports: [CronService],
})
export class CronModule {}
