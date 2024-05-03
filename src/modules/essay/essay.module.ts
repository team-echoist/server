import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EssayController } from './essay.controller';
import { EssayService } from './essay.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';
import { EssayRepository } from './essay.repository';
import { AuthRepository } from '../auth/auth.repository';
import { UserRepository } from '../user/user.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import * as strategies from '../../common/guards/strategies';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User, Essay, ReviewQueue]),
  ],
  controllers: [EssayController],
  providers: [
    AuthService,
    AuthRepository,
    MailService,
    EssayService,
    EssayRepository,
    UserService,
    UserRepository,
    RedisService,
    strategies.JwtStrategy,
  ],
})
export class EssayModule {}
