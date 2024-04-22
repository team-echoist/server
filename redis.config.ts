import { redisStore } from 'cache-manager-redis-store';
import * as dotenv from 'dotenv';

dotenv.config();

export const redisConfig = {
  store: redisStore,
  url: process.env.REDIS_URL,
  ttl: 300,
  max: 1000,
};
