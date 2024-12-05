import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject('REDLOCK') private readonly redlock: Redlock,
  ) {}

  async acquireLock(lockKey: string, ttl: number): Promise<Lock> {
    try {
      return await this.redlock.acquire([lockKey], ttl);
    } catch (err) {
      throw new HttpException(
        '락을 획득할 수 없습니다. 잠시 후 다시 시도하세요.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
    } catch (err) {
      console.error('락 해제 실패:', err.message);
    }
  }

  async setCache(key: string, value: string, ttl?: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async getCache(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async deleteCache(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
