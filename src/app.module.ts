import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtInterceptor } from './common/interceptros/Jwt.interceptor';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';

@Module({
  imports: [
    AuthModule,
    EssayModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: process.env.ENV === 'prod' ? 'cluster' : 'single',
        nodes: [
          {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
          },
        ],
      }),
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: JwtInterceptor }],
})
export class AppModule {}
