import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../../entities/user.entity';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private userRepository: IUserRepository,
  ) {}

  async register(createAuthDto: CreateUserDto): Promise<User> {
    const { email, password, birthDate, gender } = createAuthDto;
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('Email already exists');
    }

    return this.userRepository.createUser(email, password, birthDate, gender);
  }
}
