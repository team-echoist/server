import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { ConfigService } from '@nestjs/config';

export const RedlockProvider: Provider = {
  provide: 'REDLOCK',
  useFactory: (configService: ConfigService) => {
    const redisHost = configService.get<string>('REDIS_HOST');
    const redisPort = configService.get<number>('REDIS_PORT');

    const redisClient = new Redis({
      host: redisHost,
      port: redisPort,
    });

    return new Redlock([redisClient], {
      retryCount: 10,
      retryDelay: 200,
    });
  },
  inject: [ConfigService],
};
