import { Module } from '@nestjs/common';
import * as strategies from '../../../common/guards/strategies';
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
} from './api/admin.controller';
import { UserModule } from '../user/user.module';
import { EssayModule } from '../essay/essay.module';
import { MailModule } from '../../utils/mail/mail.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { AwsModule } from '../../adapters/aws/aws.module';
import { AdminService } from './core/admin.service';
import { AdminRepository } from './infrastructure/admin.repository';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';
import { ReportQueue } from '../../../entities/reportQueue.entity';
import { User } from '../../../entities/user.entity';
import { Essay } from '../../../entities/essay.entity';
import { Subscription } from '../../../entities/subscription.entity';
import { ProcessedHistory } from '../../../entities/processedHistory.entity';
import { Story } from '../../../entities/story.entity';
import { Admin } from '../../../entities/admin.entity';
import { Inquiry } from '../../../entities/inquiry.entity';
import { Notice } from '../../../entities/notice.entity';
import { SupportModule } from '../../features/contact/support/support.module';
import { Release } from '../../../entities/release.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AdminProcessor } from './core/admin.processor';
import { AlertModule } from '../../features/contact/alert/alert.module';
import { CronModule } from '../../utils/cron/cron.module';
import { GeulroquisModule } from '../../features/content/geulroquis/geulroquis.module';
import { Server } from '../../../entities/server.entity';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { Theme } from '../../../entities/theme.entity';
import { Item } from '../../../entities/item.entity';
import { UserItem } from '../../../entities/userItem.entity';
import { UserHomeItem } from '../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../entities/userHomeLayout.entity';
import { UserTheme } from '../../../entities/userTheme.entity';

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
