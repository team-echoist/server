import { Module } from '@nestjs/common';
import * as strategies from '../../common/guards/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
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
import { UpdatedHistory } from '../../entities/updatedHistory.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
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
      UpdatedHistory,
    ]),
    UserModule,
    EssayModule,
    MailModule,
    UtilsModule,
    AwsModule,
    SupportModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminRepository,
    strategies.AdminJwtStrategy,
    strategies.AdminLocalStrategy,
  ],
  exports: [AdminService],
})
export class AdminModule {}
