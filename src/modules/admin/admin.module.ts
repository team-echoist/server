import * as strategies from '../../common/guards/strategies';
import { MailService } from '../mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthRepository } from '../auth/auth.repository';
import { UserRepository } from '../user/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { DayUtils } from '../../common/utils/day.utils';
import { Essay } from '../../entities/essay.entity';
import { EssayRepository } from '../essay/essay.repository';
import { Subscription } from '../../entities/subscription.entity';
import { Category } from '../../entities/category.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([
      User,
      Essay,
      Category,
      ReviewQueue,
      ReportQueue,
      Subscription,
      ProcessedHistory,
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminRepository,
    AuthService,
    AuthRepository,
    UserRepository,
    EssayRepository,
    MailService,
    DayUtils,
    strategies.JwtStrategy,
  ],
  exports: [],
})
export class AdminModule {}
