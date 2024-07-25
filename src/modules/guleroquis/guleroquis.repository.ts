import { InjectRepository } from '@nestjs/typeorm';
import { Guleroquis } from '../../entities/guleroguis.entity';
import { Repository } from 'typeorm';

export class GuleroquisRepository {
  constructor(
    @InjectRepository(Guleroquis) private readonly guleroquisRepository: Repository<Guleroquis>,
  ) {}

  async saveGuleroquis(guleroquis: Guleroquis) {
    return this.guleroquisRepository.save(guleroquis);
  }

  async findGuleroquis(page: number, limit: number) {
    const [guleroquis, total] = await this.guleroquisRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdDate: 'DESC' },
    });
    return { guleroquis, total };
  }

  async findTodayGuleroquis() {
    return this.guleroquisRepository.findOne({
      where: { current: true },
    });
  }

  async countTotalGuleroquis() {
    return this.guleroquisRepository.count();
  }

  async countAvailableGuleroquis() {
    return this.guleroquisRepository.count({ where: { provided: false } });
  }

  async findTomorrowGuleroquis() {
    return this.guleroquisRepository.findOne({ where: { next: true } });
  }

  async findNextGuleroquis(guleroquisId: number) {
    return this.guleroquisRepository.findOne({ where: { id: guleroquisId } });
  }
}
