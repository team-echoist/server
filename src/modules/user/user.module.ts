import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AwsModule } from '../aws/aws.module';
import { UtilsModule } from '../utils/utils.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import * as strategies from '../../common/guards/strategies';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    MailModule,
    AwsModule,
    UtilsModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, strategies.JwtStrategy],
  exports: [UserService, UserRepository],
})
export class UserModule {}
