import { Injectable } from '@nestjs/common';
import { ViewRepository } from './view.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ViewRecord } from '../../entities/viewRecord.entity';
import { UtilsService } from '../utils/utils.service';
import { EssaysResDto } from '../essay/dto/response/essaysRes.dto';

@Injectable()
export class ViewService {
  constructor(
    private readonly viewRepository: ViewRepository,
    private readonly utilsSerivce: UtilsService,
  ) {}

  async addViewRecord(user: User, essay: Essay) {
    let viewRecord = await this.viewRepository.findViewRecord(user, essay);

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
    const { essays, total } = await this.viewRepository.findRecentViewedEssays(userId, page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const essaysDto = this.utilsSerivce.transformToDto(EssaysResDto, essays);

    return { essays: essaysDto, totalPage, page, total };
  }
}
