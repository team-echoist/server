import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { UtilsService } from '../utils/utils.service';
import { AuthRepository } from './auth.repository';
import { User } from '../../entities/user.entity';
import * as strategies from '../../common/guards/strategies';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    MailService,
    UtilsService,
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
  ],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
