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
      .createQueryBuilder('view_record')
      .leftJoinAndSelect('view_record.essay', 'essay')
      .leftJoin('view_record.user', 'user')
      .where('view_record.user = :userId', { userId })
      .orderBy('view_record.viewed_date', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [viewRecords, total] = await queryBuilder.getManyAndCount();

    return { viewRecords, total };
  }

  async recentEssayIds(userId: number, recentCount: number) {
    return await this.viewRepository
      .createQueryBuilder('viewRecord')
      .select(['viewRecord.essayId', 'viewRecord.viewedDate'])
      .where('viewRecord.userId = :userId', { userId })
      .orderBy('viewRecord.viewedDate', 'DESC')
      .limit(recentCount)
      .getRawMany();
  }
}
