import { InjectRepository } from '@nestjs/typeorm';
import { ViewRecord } from '../../entities/viewRecord.entity';
import { Repository } from 'typeorm';
import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';

export class ViewRepository {
  constructor(
    @InjectRepository(ViewRecord)
    private readonly viewRepository: Repository<ViewRecord>,
  ) {}

  async findViewRecord(user: User, essay: Essay) {
    return await this.viewRepository.findOne({ where: { user: user, essay: essay } });
  }

  async saveViewRecord(viewRecord: ViewRecord) {
    await this.viewRepository.save(viewRecord);
  }
}
