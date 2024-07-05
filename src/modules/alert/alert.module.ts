import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../entities/alert.entity';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AlertRepository } from './alert.repository';
import { User } from '../../entities/user.entity';
import { UtilsModule } from '../utils/utils.module';
import { FcmService } from '../fcm/fcm.service';
import { SupportModule } from '../support/support.module';
import { AwsModule } from '../aws/aws.module';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AlertProcessor } from './alert.processor';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, User]),
    BullModule.registerQueueAsync({
      name: 'alert',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    UtilsModule,
    SupportModule,
    AwsModule,
    UserModule,
  ],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository, FcmService, AlertProcessor],
  exports: [AlertService, AlertRepository],
})
export class AlertModule {}
