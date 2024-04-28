import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const redisConfig: RedisModuleOptions = {
  type: process.env.ENV === 'prod' ? 'cluster' : 'single',
  nodes: [
    {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    },
  ],
};
