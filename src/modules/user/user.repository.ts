import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserById(userId: number) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  async saveUser(user: User) {
    return await this.userRepository.save(user);
  }

  // ------------------------------------------------------admin api
  async usersCount() {
    return await this.userRepository.count();
  }

  async countDailyRegistrations(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    return await this.userRepository
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
    return await this.userRepository
      .createQueryBuilder('user')
      .select('EXTRACT(MONTH FROM user.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM user.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM user.createdDate)')
      .orderBy('EXTRACT(MONTH FROM user.createdDate)', 'ASC')
      .getRawMany();
  }
}
