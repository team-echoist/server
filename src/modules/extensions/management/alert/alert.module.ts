import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertController } from './api/alert.controller';
import { AlertProcessor } from './core/alert.processor';
import { AlertService } from './core/alert.service';
import { AlertRepository } from './infrastructure/alert.repository';
import { Alert } from '../../../../entities/alert.entity';
import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { Essay } from '../../../../entities/essay.entity';
import { User } from '../../../../entities/user.entity';
import { AwsModule } from '../../../adapters/aws/aws.module';
import { FirebaseService } from '../../../adapters/firebase/core/firebase.service';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Alert, User, Essay, DeactivationReason]),
    BullModule.registerQueueAsync({
      name: 'alert',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        prefix: '{bull}',
      }),
      inject: [ConfigService],
    }),
    ToolModule,
    SupportModule,
    AwsModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [AlertController],
  providers: [
    AlertService,
    { provide: 'IAlertRepository', useClass: AlertRepository },
    FirebaseService,
    AlertProcessor,
  ],
  exports: [AlertService, { provide: 'IAlertRepository', useClass: AlertRepository }],
})
export class AlertModule {}
