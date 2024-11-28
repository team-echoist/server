import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolModule } from '../../utils/tool/tool.module';
import { MailModule } from '../../utils/mail/mail.module';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { AuthController } from './api/auth.controller';
import { AuthService } from './core/auth.service';
import { AuthRepository } from './infrastructure/auth.repository';
import { User } from '../../../entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import * as strategies from '../../../common/guards/strategies';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../../adapters/aws/aws.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { HomeModule } from '../../features/account/home/home.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    ConfigModule,
    HttpModule,
    MailModule,
    ToolModule,
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
