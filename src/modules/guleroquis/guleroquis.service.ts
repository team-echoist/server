import { Injectable } from '@nestjs/common';
import { GuleroquisRepository } from './guleroquis.repository';
import { Guleroquis } from '../../entities/guleroguis.entity';

@Injectable()
export class GuleroquisService {
  constructor(private readonly guleroquisRepository: GuleroquisRepository) {}

  async saveGuleroquis(url: string) {
    const guleroquis = new Guleroquis();
    guleroquis.url = url;
    return this.guleroquisRepository.saveGuleroquis(guleroquis);
  }
}
