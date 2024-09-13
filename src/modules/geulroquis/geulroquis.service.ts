import { Injectable } from '@nestjs/common';
import { GeulroquisRepository } from './geulroquis.repository';
import { Geulroquis } from '../../entities/geulroguis.entity';
import { UtilsService } from '../utils/utils.service';
import { GeulroquisDto } from './dto/response/geulroquis.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GeulroquisUrlResDto } from './dto/response/geulroquisUrlRes.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class GeulroquisService {
  constructor(
    private readonly geulroquisRepository: GeulroquisRepository,
    private readonly utilsService: UtilsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Transactional()
  async saveGeulroquis(url: string) {
    const geulroquis = new Geulroquis();
    geulroquis.url = url;
    return this.geulroquisRepository.saveGeulroquis(geulroquis);
  }

  @Transactional()
  async getGeulroquis(page: number, limit: number) {
    const { geulroquis, total } = await this.geulroquisRepository.findGeulroquis(page, limit);
    const quleroquisDto = this.utilsService.transformToDto(GeulroquisDto, geulroquis);

    return { quleroquisDto, total, page };
  }

  @Transactional()
  async todayGeulroquis() {
    const cacheKey = `today_geulroquis`;
    const cachedGeulroquis = await this.redis.get(cacheKey);

    if (cachedGeulroquis) {
      return JSON.parse(cachedGeulroquis);
    }

    const todayGeulroquis = await this.geulroquisRepository.findTodayGeulroquis();

    await this.redis.set(cacheKey, JSON.stringify(todayGeulroquis.url), 'EX', 24 * 60 * 60);

    return this.utilsService.transformToDto(GeulroquisUrlResDto, todayGeulroquis.url);
  }
}
