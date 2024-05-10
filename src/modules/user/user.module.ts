import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import * as strategies from '../../common/guards/strategies';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { AuthRepository } from '../auth/auth.repository';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    AuthService,
    AuthRepository,
    MailService,
    AwsService,
    UtilsService,
    strategies.JwtStrategy,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
