import { Injectable } from '@nestjs/common';
import { ViewRepository } from './view.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ViewRecord } from '../../entities/viewRecord.entity';

@Injectable()
export class ViewService {
  constructor(private readonly viewRepository: ViewRepository) {}

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
}
