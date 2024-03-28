import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { IUserRepository } from './user.repository.interface';

export class UserRepository extends Repository<User> implements IUserRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    return this.findOne({ where: { email } });
  }

  async createUser(
    email: string,
    password: string,
    birthDate: string,
    gender: string,
  ): Promise<User> {
    const user = this.create({ email, password, birthDate, gender });
    await this.save(user);
    return user;
  }
}
