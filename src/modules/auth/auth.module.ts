import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { MailModule } from '../mail/mail.module';
import { NicknameModule } from '../nickname/nickname.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User } from '../../entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import * as strategies from '../../common/guards/strategies';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([User]),
    MailModule,
    UtilsModule,
    NicknameModule,
    ConfigModule,
    AwsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
    strategies.AppleStrategy,
  ],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
