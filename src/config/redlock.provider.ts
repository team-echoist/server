import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

const redisClient = new Redis();

const redlock = new Redlock([redisClient], {
  retryCount: 10,
  retryDelay: 200,
});

export const RedlockProvider: Provider = {
  provide: 'REDLOCK',
  useValue: redlock,
};
