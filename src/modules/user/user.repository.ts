import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { DeactivationReason } from '../../entities/deactivationReason.entity';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DeactivationReason)
    private readonly deactivationReasonRepository: Repository<DeactivationReason>,
  ) {}

  async findUserById(userId: number) {
    return this.userRepository.findOne({ where: { id: userId }, relations: ['device'] });
  }

  async saveUser(user: User) {
    return this.userRepository.save(user);
  }

  async usersCount() {
    return this.userRepository.count();
  }

  async countDailyRegistrations(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    return this.userRepository
      .createQueryBuilder('user')
      .select('EXTRACT(DAY FROM user.createdDate)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdDate >= :start AND user.createdDate <= :end', {
        start: firstDayOfMonth,
        end: lastDayOfMonth,
      })
      .groupBy('EXTRACT(DAY FROM user.createdDate)')
      .orderBy('EXTRACT(DAY FROM user.createdDate)', 'ASC')
      .getRawMany();
  }

  async countMonthlyRegistrations(year: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .select('EXTRACT(MONTH FROM user.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM user.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM user.createdDate)')
      .orderBy('EXTRACT(MONTH FROM user.createdDate)', 'ASC')
      .getRawMany();
  }

  async findUsers(today: Date, filter: string, page: number, limit: number) {
    let users: User[], total: number;

    switch (filter) {
      case 'monitored':
        [users, total] = await this.userRepository.findAndCount({
          where: { status: UserStatus.MONITORED },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdDate: 'DESC' },
        });
        break;
      case 'activeSubscription':
        [users, total] = await this.userRepository.findAndCount({
          where: { subscriptionEnd: MoreThan(today) },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdDate: 'DESC' },
        });
        break;
      default:
        [users, total] = await this.userRepository.findAndCount({
          skip: (page - 1) * limit,
          take: limit,
          order: { createdDate: 'DESC' },
        });
        break;
    }

    return { users, total };
  }

  async findUserDetailById(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['essays', 'reports', 'reviews'],
    });
  }

  async updateUser(user: User, data: UpdateUserReqDto) {
    const userData = this.userRepository.create({ ...user, ...data });
    return this.userRepository.save(userData);
  }

  async increaseReputation(userId: number, newReputation: number) {
    await this.userRepository.update(userId, { reputation: newReputation });
  }

  async decreaseReputation(userId: number, newReputation: number) {
    await this.userRepository.update(userId, { reputation: newReputation });
  }

  async saveDeactivationReasons(deactivationReasons: DeactivationReason[]) {
    await this.deactivationReasonRepository.save(deactivationReasons);
  }

  async deleteAccount(userId: number, todayDate: string) {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        email: () => `CONCAT('${todayDate}_', email)`,
        nickname: null,
        deletedDate: () => `NOW()`,
      })
      .where('id = :userId', { userId })
      .execute();
  }
}
