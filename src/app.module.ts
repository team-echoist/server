import { redisConfig } from '../redis.config';
import { typeOrmConfig } from '../typeorm.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtInterceptor } from './common/interceptros/jwt.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';
import { MailModule } from './modules/mail/mail.module';
import { DeviceInterceptor } from './common/interceptros/device.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    RedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
    AuthModule,
    EssayModule,
    MailModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DeviceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JwtInterceptor },
  ],
})
export class AppModule {}
