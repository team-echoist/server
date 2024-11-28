import { InjectRepository } from '@nestjs/typeorm';
import { Geulroquis } from '../../../../entities/geulroguis.entity';
import { Repository } from 'typeorm';

export class GeulroquisRepository {
  constructor(
    @InjectRepository(Geulroquis) private readonly geulroquisRepository: Repository<Geulroquis>,
  ) {}

  async saveGeulroquis(geulroquis: Geulroquis) {
    return this.geulroquisRepository.save(geulroquis);
  }

  async findGeulroquis(page: number, limit: number) {
    const [geulroquis, total] = await this.geulroquisRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { geulroquis, total };
  }

  async findTodayGeulroquis() {
    return this.geulroquisRepository.findOne({
      where: { current: true },
    });
  }

  async countTotalGeulroquis() {
    return this.geulroquisRepository.count();
  }

  async countAvailableGeulroquis() {
    return this.geulroquisRepository.count({ where: { provided: false } });
  }

  async findTomorrowGeulroquis() {
    return this.geulroquisRepository.findOne({ where: { next: true } });
  }

  async findCurrentGeulroquis() {
    return this.geulroquisRepository.findOne({ where: { current: true } });
  }

  async findOneGeulroquis(geulroquisId: number) {
    return this.geulroquisRepository.findOne({ where: { id: geulroquisId } });
  }

  async findOneNextGeulroquis() {
    return this.geulroquisRepository.findOne({
      where: { current: false, next: false },
      order: { createdDate: 'ASC' },
    });
  }

  async deleteAllGeulroquis() {
    return this.geulroquisRepository.delete({});
  }
}
