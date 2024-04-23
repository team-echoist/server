import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtInterceptor } from './common/interceptros/Jwt.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    CacheModule.register({
      global: true,
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: JwtInterceptor }],
})
export class AppModule {}
