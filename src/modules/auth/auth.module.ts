import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { MailModule } from '../mail/mail.module';
import { NicknameModule } from '../nickname/nickname.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { AuthRepository } from './repository/auth.repository';
import { User } from '../../entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import * as strategies from '../../common/guards/strategies';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { HomeModule } from '../home/home.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    ConfigModule,
    HttpModule,
    MailModule,
    UtilsModule,
    NicknameModule,
    AwsModule,
    HomeModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: 'IAuthRepository', useClass: AuthRepository },
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
    strategies.AppleStrategy,
  ],
  exports: [AuthService, { provide: 'IAuthRepository', useClass: AuthRepository }],
})
export class AuthModule {}
