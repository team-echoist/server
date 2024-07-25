import { Injectable } from '@nestjs/common';
import { GuleroquisRepository } from './guleroquis.repository';
import { Guleroquis } from '../../entities/guleroguis.entity';
import { UtilsService } from '../utils/utils.service';
import { GuleroquisDto } from './dto/response/guleroquis.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GuleroquisUrlResDto } from './dto/response/guleroquisUrlRes.dto';
import { GuleroquisCountResDto } from './dto/response/guleroquisCountRes.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class GuleroquisService {
  constructor(
    private readonly guleroquisRepository: GuleroquisRepository,
    private readonly utilsService: UtilsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Transactional()
  async saveGuleroquis(url: string) {
    const guleroquis = new Guleroquis();
    guleroquis.url = url;
    return this.guleroquisRepository.saveGuleroquis(guleroquis);
  }

  @Transactional()
  async getGuleroquis(page: number, limit: number) {
    const { guleroquis, total } = await this.guleroquisRepository.findGuleroquis(page, limit);
    const quleroquisDto = this.utilsService.transformToDto(GuleroquisDto, guleroquis);

    return { quleroquisDto, total, page };
  }

  @Transactional()
  async todayGuleroquis() {
    const cacheKey = `today_guleroquis`;
    const cachedGuleroquis = await this.redis.get(cacheKey);

    if (cachedGuleroquis) {
      return JSON.parse(cachedGuleroquis);
    }

    const todayGuleroquis = await this.guleroquisRepository.findTodayGuleroquis();

    await this.redis.set(cacheKey, JSON.stringify(todayGuleroquis.url), 'EX', 24 * 60 * 60);

    return this.utilsService.transformToDto(GuleroquisUrlResDto, todayGuleroquis.url);
  }

  @Transactional()
  async getGuleroquisCount() {
    const total = await this.guleroquisRepository.countTotalGuleroquis();
    const available = await this.guleroquisRepository.countAvailableGuleroquis();

    return this.utilsService.transformToDto(GuleroquisCountResDto, { total, available });
  }

  @Transactional()
  async changeTomorrowGuleroquis(guleroquisId: number) {
    const TomorrowGuleroquis = await this.guleroquisRepository.findTomorrowGuleroquis();
    if (TomorrowGuleroquis) {
      TomorrowGuleroquis.next = false;
      await this.guleroquisRepository.saveGuleroquis(TomorrowGuleroquis);
    }

    const nextGuleroquis = await this.guleroquisRepository.findNextGuleroquis(guleroquisId);
    nextGuleroquis.next = true;
    await this.guleroquisRepository.saveGuleroquis(nextGuleroquis);
  }
}
