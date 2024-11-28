import { InjectRepository } from '@nestjs/typeorm';
import { ViewRecord } from '../../../../../entities/viewRecord.entity';
import { Repository } from 'typeorm';
import { IViewRepository } from './iview.repository';

export class ViewRepository implements IViewRepository {
  constructor(
    @InjectRepository(ViewRecord)
    private readonly viewRepository: Repository<ViewRecord>,
  ) {}

  async findViewRecord(userId: number, essayId: number) {
    return await this.viewRepository
      .createQueryBuilder('view_record')
      .leftJoinAndSelect('view_record.user', 'user')
      .leftJoinAndSelect('view_record.essay', 'essay')
      .where('user.id = :userId', { userId })
      .andWhere('essay.id = :essayId', { essayId })
      .getOne();
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
      .createQueryBuilder('view_record')
      .select(['view_record.viewedDate', 'view_record.essay.id'])
      .where('view_record.user.id = :userId', { userId })
      .orderBy('view_record.viewedDate', 'DESC')
      .limit(recentCount)
      .getRawMany();
  }
}
