import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import * as strategies from '../../common/guards/strategies';
import * as dotenv from 'dotenv';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

dotenv.config();
console.log('테스트: ', process.env.JWT_SECRET);
console.log('테스트: ', process.env.REDIS_HOST, process.env.REDIS_PORT);

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
    TypeOrmModule.forFeature([User]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    strategies.LocalStrategy,
    strategies.GoogleStrategy,
    strategies.KakaoStrategy,
    strategies.NaverStrategy,
  ],
})
export class AuthModule {}
