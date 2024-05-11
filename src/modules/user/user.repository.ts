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
}
