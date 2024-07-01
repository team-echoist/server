import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from '../../entities/alert.entity';
import { Repository } from 'typeorm';

export class AlertRepository {
  constructor(@InjectRepository(Alert) private readonly alertRepository: Repository<Alert>) {}

  async saveAlert(alert: Alert) {
    return this.alertRepository.save(alert);
  }

  async countingAlert(userId: number) {
    return this.alertRepository.count({ where: { user: { id: userId }, read: false } });
  }

  async findAlerts(userId: number, page: number, limit: number) {
    const queryBuilder = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.user_id = :userId', { userId })
      .orderBy('alert.createdDate', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [alerts, total] = await queryBuilder.getManyAndCount();

    return { alerts, total };
  }

  async findAlert(userId: number, alertId: number) {
    return this.alertRepository.findOne({ where: { user: { id: userId }, id: alertId } });
  }
}
