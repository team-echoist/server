import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { MoreThan, Repository } from 'typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserById(userId: number) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async saveUser(user: User) {
    return this.userRepository.save(user);
  }

  // ------------------------------------------------------admin api
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
      case 'banned':
        [users, total] = await this.userRepository.findAndCount({
          where: { banned: true },
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
}
