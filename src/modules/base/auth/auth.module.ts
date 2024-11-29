import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthLocalController } from './api/auth.local.controller';
import { AuthManagementController } from './api/auth.management.controller';
import { AuthOauthController } from './api/auth.oauth.controller';
import { AuthService } from './core/auth.service';
import * as strategies from '../../../common/guards/strategies';
import { DeactivationReason } from '../../../entities/deactivationReason.entity';
import { User } from '../../../entities/user.entity';
import { AwsModule } from '../../adapters/aws/aws.module';
import { HomeModule } from '../../extensions/user/home/home.module';
import { MailModule } from '../../utils/mail/mail.module';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { UserRepository } from '../user/infrastructure/user.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DeactivationReason]),
    JwtModule.register({}),
    ConfigModule,
    HttpModule,
    MailModule,
    ToolModule,
    NicknameModule,
    AwsModule,
    forwardRef(() => HomeModule),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthLocalController, AuthOauthController, AuthManagementController],
  providers: [
    AuthService,
    { provide: 'IUserRepository', useClass: UserRepository },
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
    strategies.AppleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
