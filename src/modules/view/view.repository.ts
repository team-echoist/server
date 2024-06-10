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

  async findRecentViewedEssays(userId: number, page: number, limit: number) {
    const queryBuilder = this.viewRepository
      .createQueryBuilder('viewRecord')
      .leftJoinAndSelect('viewRecord.essay', 'essay')
      .where('viewRecord.user.id = :userId', { userId })
      .orderBy('viewRecord.viewedAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [viewRecords, total] = await queryBuilder.getManyAndCount();

    return { viewRecords, total };
  }
}
