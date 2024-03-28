import { User } from '../../entities/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, password: string, birthDate: string, gender: string): Promise<User>;
}
