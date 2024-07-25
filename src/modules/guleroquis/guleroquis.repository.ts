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
}
