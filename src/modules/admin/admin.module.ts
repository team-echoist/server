import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from '../mail/mail.service';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { UtilsService } from '../utils/utils.service';
import { AdminRepository } from './admin.repository';
import { AuthRepository } from '../auth/auth.repository';
import { UserRepository } from '../user/user.repository';
import { EssayRepository } from '../essay/essay.repository';
import { User } from '../../entities/user.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { Essay } from '../../entities/essay.entity';
import { Subscription } from '../../entities/subscription.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { Category } from '../../entities/category.entity';
import * as strategies from '../../common/guards/strategies';

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
    UtilsService,
    strategies.JwtStrategy,
  ],
  exports: [],
})
export class AdminModule {}
