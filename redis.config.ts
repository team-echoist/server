import { redisStore } from 'cache-manager-redis-store';
import * as dotenv from 'dotenv';

dotenv.config();

export const redisConfig = {
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  ttl: 300,
  max: 1000,
};
