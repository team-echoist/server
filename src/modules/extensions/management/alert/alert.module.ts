import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../../../entities/alert.entity';
import { AlertController } from './api/alert.controller';
import { AlertService } from './core/alert.service';
import { AlertRepository } from './infrastructure/alert.repository';
import { User } from '../../../../entities/user.entity';
import { ToolModule } from '../../../utils/tool/tool.module';
import { FirebaseService } from '../../../adapters/firebase/core/firebase.service';
import { SupportModule } from '../support/support.module';
import { AwsModule } from '../../../adapters/aws/aws.module';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AlertProcessor } from './core/alert.processor';
import { UserModule } from '../../../base/user/user.module';
import { Essay } from '../../../../entities/essay.entity';
import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';

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
