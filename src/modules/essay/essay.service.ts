import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EssayRepository } from './essay.repository';

@Injectable()
export class EssayService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly essayRepository: EssayRepository,
  ) {}
}
