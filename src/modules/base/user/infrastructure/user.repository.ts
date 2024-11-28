import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../../../../common/types/enum.types';
import { IUserRepository } from './iuser.repository';

export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DeactivationReason)
    private readonly deactivationReasonRepository: Repository<DeactivationReason>,

    private readonly configService: ConfigService,
  ) {}

  async findUserById(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['devices', 'homeLayouts', 'homeLayouts.homeItems', 'homeLayouts.homeItems.item'],
    });
  }

  async findUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email: email }, relations: ['devices'] });
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
          withDeleted: true,
        });
        break;
      case 'activeSubscription':
        [users, total] = await this.userRepository.findAndCount({
          where: { subscriptionEnd: MoreThan(today) },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdDate: 'DESC' },
          withDeleted: true,
        });
        break;
      default:
        [users, total] = await this.userRepository.findAndCount({
          skip: (page - 1) * limit,
          take: limit,
          order: { createdDate: 'DESC' },
          withDeleted: true,
        });
        break;
    }

    return { users, total };
  }

  async findUserDetailById(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: ['essays', 'reports', 'reviews', 'alertSettings'],
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
        status: UserStatus.DEACTIVATED,
        profileImage: this.configService.get<string>('DEFAULT_PROFILE_IMG'),
        deletedDate: () => `NOW()`,
      })
      .where('id = :userId', { userId })
      .execute();
  }

  async deleteAllAccount() {
    return this.userRepository.delete({});
  }

  async updateUserTable(userId: number, reputation: number) {
    await this.userRepository.update(
      { id: userId },
      { reputation: () => `reputationScore + ${reputation}` },
    );
  }

  async searchUsers(keyword: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const useTrigramSearch = keyword.length >= 3;

    const query = this.userRepository.createQueryBuilder('user');

    if (useTrigramSearch) {
      query
        .addSelect(`similarity(unaccented_email, :keyword)`, 'relevance')
        .where('user.deletedDate IS NULL AND unaccented_email ILIKE :wildcardKeyword', {
          keyword,
          wildcardKeyword: `%${keyword}%`,
        });
    } else {
      query
        .addSelect(`ts_rank_cd(search_vector, plainto_tsquery('simple', :keyword))`, 'relevance')
        .where(
          'user.deletedDate IS NULL AND (search_vector @@ plainto_tsquery(:keyword) OR unaccented_email ILIKE :wildcardKeyword)',
          { keyword, wildcardKeyword: `%${keyword}%` },
        );
    }

    query.orderBy('relevance', 'DESC').offset(offset).limit(limit);

    const [users, total] = await query.getManyAndCount();

    return { users, total };
  }
}
