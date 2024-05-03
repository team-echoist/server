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

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User, ReviewQueue, ReportQueue]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminRepository,
    AuthService,
    AuthRepository,
    UserRepository,
    MailService,
    strategies.AdminStrategy,
  ],
  exports: [],
})
export class AdminModule {}
