import { Module } from '@nestjs/common';
import * as strategies from '../../common/guards/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import {
  AdminOfficeController,
  AdminAuthController,
  AdminDashboardController,
  AdminInfoController,
  AdminTaskController,
  AdminManagementController,
  AdminSupportController,
  AdminRootController,
} from './admin.controller';
import { UserModule } from '../user/user.module';
import { EssayModule } from '../essay/essay.module';
import { MailModule } from '../mail/mail.module';
import { UtilsModule } from '../utils/utils.module';
import { AwsModule } from '../aws/aws.module';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { Subscription } from '../../entities/subscription.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { Story } from '../../entities/story.entity';
import { Admin } from '../../entities/admin.entity';
import { Inquiry } from '../../entities/inquiry.entity';
import { Notice } from '../../entities/notice.entity';
import { SupportModule } from '../support/support.module';
import { Release } from '../../entities/release.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AdminProcessor } from './admin.processor';
import { AlertModule } from '../alert/alert.module';
import { CronModule } from '../cron/cron.module';
import { GeulroquisModule } from '../geulroquis/geulroquis.module';
import { Server } from '../../entities/server.entity';
import { NicknameModule } from '../nickname/nickname.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    TypeOrmModule.forFeature([
      User,
      Essay,
      Story,
      ReviewQueue,
      ReportQueue,
      Subscription,
      ProcessedHistory,
      Admin,
      Inquiry,
      Notice,
      Release,
      Server,
    ]),
    BullModule.registerQueueAsync({
      name: 'admin',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        prefix: '{bull}',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    EssayModule,
    MailModule,
    UtilsModule,
    AwsModule,
    SupportModule,
    AlertModule,
    CronModule,
    GeulroquisModule,
    NicknameModule,
  ],
  controllers: [
    AdminAuthController,
    AdminInfoController,
    AdminDashboardController,
    AdminTaskController,
    AdminManagementController,
    AdminSupportController,
    AdminOfficeController,
    AdminRootController,
  ],
  providers: [
    AdminService,
    AdminRepository,
    AdminProcessor,
    strategies.AdminJwtStrategy,
    strategies.AdminLocalStrategy,
  ],
  exports: [AdminService],
})
export class AdminModule {}
