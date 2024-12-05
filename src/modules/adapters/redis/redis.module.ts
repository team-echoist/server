import { Global, Module } from '@nestjs/common';
import { RedisModule as NestJsRedisModule } from '@nestjs-modules/ioredis';

import { RedisService } from './core/redis.service';
import { redisConfig } from '../../../config/redis.config';
import { RedlockProvider } from '../../../config/redlock.provider';

@Global()
@Module({
  imports: [
    NestJsRedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
  ],
  providers: [RedisService, RedlockProvider],
  exports: [RedisService, RedlockProvider, NestJsRedisModule],
})
export class RedisModule {}
