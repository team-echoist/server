import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Transactional } from 'typeorm-transactional';

import { Geulroquis } from '../../../../../entities/geulroguis.entity';
import { ToolService } from '../../../../utils/tool/core/tool.service';
import { GeulroquisDto } from '../dto/response/geulroquis.dto';
import { GeulroquisUrlResDto } from '../dto/response/geulroquisUrlRes.dto';
import { IGeulroquisRepository } from '../infrastructure/igeulroquis.repository';

@Injectable()
export class GeulroquisService {
  constructor(
    @Inject('IGeulroquisRepository') private readonly geulroquisRepository: IGeulroquisRepository,
    private readonly utilsService: ToolService,
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
      try {
        return JSON.parse(cachedGeulroquis);
      } catch (error) {
        console.error('Redis 캐시 파싱 실패:', error);
        await this.redis.del(cacheKey);
      }
    }

    const todayGeulroquis = await this.geulroquisRepository.findTodayGeulroquis();

    if (!todayGeulroquis || !todayGeulroquis.url) {
      throw new HttpException('오늘의 글로키를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    await this.redis.set(cacheKey, JSON.stringify(todayGeulroquis.url), 'EX', 24 * 60 * 60);

    return this.utilsService.transformToDto(GeulroquisUrlResDto, todayGeulroquis.url);
  }
}
