import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User } from '../../entities/user.entity';
import * as strategies from '../../common/guards/strategies';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule, UtilsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
  ],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
