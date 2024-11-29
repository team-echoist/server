import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CronProcessor } from './core/cron.processor';
import { CronService } from './core/cron.service';
import { CronLog } from '../../../entities/cronLog.entity';
import { DeactivationReason } from '../../../entities/deactivationReason.entity';
import { Device } from '../../../entities/device.entity';
import { Essay } from '../../../entities/essay.entity';
import { Geulroquis } from '../../../entities/geulroguis.entity';
import { SyncStatus } from '../../../entities/sysncStatus.entity';
import { User } from '../../../entities/user.entity';
import { EssayModule } from '../../base/essay/essay.module';
import { ToolModule } from '../tool/tool.module';

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
      name: '{cron}cron',
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
    ToolModule,
    EssayModule,
  ],
  providers: [CronService, CronProcessor],
  exports: [CronService],
})
export class CronModule {}
