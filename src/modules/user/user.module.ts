import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AwsModule } from '../aws/aws.module';
import { EssayModule } from '../essay/essay.module';
import { UtilsModule } from '../utils/utils.module';
import { FollowModule } from '../follow/follow.module';
import { BadgeModule } from '../badge/badge.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import * as strategies from '../../common/guards/strategies';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User, Essay]),
    AuthModule,
    FollowModule,
    MailModule,
    AwsModule,
    UtilsModule,
    BadgeModule,
    forwardRef(() => EssayModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, strategies.JwtStrategy],
  exports: [UserService, UserRepository],
})
export class UserModule {}
