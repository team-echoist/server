import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AdminOfficeController,
  AdminAuthController,
  AdminDashboardController,
  AdminInfoController,
  AdminTaskController,
  AdminManagementController,
  AdminSupportController,
  AdminRootController,
} from './api/admin.controller';
import { AdminProcessor } from './core/admin.processor';
import { AdminService } from './core/admin.service';
import { AdminRepository } from './infrastructure/admin.repository';
import * as strategies from '../../../common/guards/strategies';
import { Admin } from '../../../entities/admin.entity';
import { AppVersions } from '../../../entities/appVersions.entity';
import { Essay } from '../../../entities/essay.entity';
import { Inquiry } from '../../../entities/inquiry.entity';
import { Item } from '../../../entities/item.entity';
import { Notice } from '../../../entities/notice.entity';
import { ProcessedHistory } from '../../../entities/processedHistory.entity';
import { Release } from '../../../entities/release.entity';
import { ReportQueue } from '../../../entities/reportQueue.entity';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';
import { Server } from '../../../entities/server.entity';
import { Story } from '../../../entities/story.entity';
import { Subscription } from '../../../entities/subscription.entity';
import { Theme } from '../../../entities/theme.entity';
import { User } from '../../../entities/user.entity';
import { UserHomeItem } from '../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../entities/userHomeLayout.entity';
import { UserItem } from '../../../entities/userItem.entity';
import { UserTheme } from '../../../entities/userTheme.entity';
import { AwsModule } from '../../adapters/aws/aws.module';
import { GeulroquisModule } from '../../extensions/essay/geulroquis/geulroquis.module';
import { AlertModule } from '../../extensions/management/alert/alert.module';
import { SupportModule } from '../../extensions/management/support/support.module';
import { CronModule } from '../../utils/cron/cron.module';
import { MailModule } from '../../utils/mail/mail.module';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { EssayModule } from '../essay/essay.module';
import { UserModule } from '../user/user.module';

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
      Theme,
      Item,
      UserItem,
      UserHomeItem,
      UserHomeLayout,
      UserTheme,
      AppVersions,
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
    ToolModule,
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
    { provide: 'IAdminRepository', useClass: AdminRepository },
    AdminProcessor,
    strategies.AdminJwtStrategy,
    strategies.AdminLocalStrategy,
  ],
  exports: [AdminService],
})
export class AdminModule {}
