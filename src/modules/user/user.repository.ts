import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(
    email: string,
    password: string,
    birthDate: string,
    gender: string,
  ): Promise<User> {
    const user = this.userRepository.create({ email, password, birthDate, gender });
    await this.userRepository.save(user);
    return user;
  }
}
