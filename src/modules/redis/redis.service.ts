import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  @InjectRedis() private readonly redis: Redis;

  async getCached(key: string): Promise<any> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setCached(key: string, data: any, ttl: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
  }

  async deleteCachePattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    let pipeline = this.redis.pipeline();
    let keysDeleted = 0;

    for await (const keys of stream) {
      if (keys.length) {
        pipeline.del(...keys);
        keysDeleted += keys.length;

        if (pipeline.length >= 1000) {
          await pipeline.exec(); // 1000개 명령마다
          pipeline = this.redis.pipeline(); // 파이프라인 재설정
        }
      }
    }

    if (pipeline.length) {
      await pipeline.exec(); // 나머지 명령 실행
    }

    console.log(`Deleted ${keysDeleted} keys matching pattern ${pattern}`);
  }
}
