import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { UserRepository } from './user.repository';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userRepository: UserRepository,
  ) {}
}
