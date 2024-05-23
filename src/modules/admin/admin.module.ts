import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { EssayModule } from '../essay/essay.module';
import { MailModule } from '../mail/mail.module';
import { UtilsModule } from '../utils/utils.module';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
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
    AuthModule,
    UserModule,
    EssayModule,
    MailModule,
    UtilsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, strategies.JwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
