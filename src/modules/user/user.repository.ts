import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(userId: number) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  // ------------------------------------------------------admin api
  async usersCount() {
    return await this.userRepository.count();
  }

  // ------------------------------------------------------storage api

  async profileImageUpload(userId: number, imageUrl: string) {
    return await this.userRepository.update({ id: userId }, { profileImage: imageUrl });
  }
}
