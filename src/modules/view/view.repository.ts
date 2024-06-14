import { InjectRepository } from '@nestjs/typeorm';
import { ViewRecord } from '../../entities/viewRecord.entity';
import { Repository } from 'typeorm';

export class ViewRepository {
  constructor(
    @InjectRepository(ViewRecord)
    private readonly viewRepository: Repository<ViewRecord>,
  ) {}

  async findViewRecord(userId: number, essayId: number) {
    return await this.viewRepository.findOne({
      where: { user: { id: userId }, essay: { id: essayId } },
    });
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
