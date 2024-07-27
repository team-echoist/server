import { Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GeulroquisService } from '../geulroquis/geulroquis.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly homeRepository: HomeRepository,
    private readonly geulroquisService: GeulroquisService,
  ) {}

  async todayGeulroquis() {
    return this.geulroquisService.todayGeulroquis();
  }
}
