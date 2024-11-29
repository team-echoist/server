import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { Essay } from '../../../../../entities/essay.entity';
import { User } from '../../../../../entities/user.entity';
import { ViewRecord } from '../../../../../entities/viewRecord.entity';
import { IViewRepository } from '../infrastructure/iview.repository';

@Injectable()
export class ViewService {
  constructor(@Inject('IViewRepository') private readonly viewRepository: IViewRepository) {}

  async findViewRecord(userId: number, essayId: number) {
    return await this.viewRepository.findViewRecord(userId, essayId);
  }

  @Transactional()
  async addViewRecord(user: User, essay: Essay) {
    let viewRecord = await this.viewRepository.findViewRecord(user.id, essay.id);

    if (viewRecord) {
      viewRecord.viewedDate = new Date();
    } else {
      viewRecord = new ViewRecord();
      viewRecord.user = user;
      viewRecord.essay = essay;
    }

    await this.viewRepository.saveViewRecord(viewRecord);
  }

  async findRecentViewedEssays(userId: number, page: number, limit: number) {
    return await this.viewRepository.findRecentViewedEssays(userId, page, limit);
  }

  async getRecentEssayIds(userId: number, recentCount: number) {
    const recentEssayIds = await this.viewRepository.recentEssayIds(userId, recentCount);
    const essayIds = recentEssayIds.map((record) => record.essayId);

    if (essayIds.length === 0) {
      return [];
    }
    return essayIds;
  }
}
