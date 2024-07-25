import { Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GuleroquisService } from '../guleroquis/guleroquis.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly homeRepository: HomeRepository,
    private readonly guleroquisService: GuleroquisService,
  ) {}

  async todayGuleroquis() {
    return this.guleroquisService.todayGuleroquis();
  }
}
