import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';

export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number) {
    return this.userRepository.findOne({ where: { id: id } });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByNickname(nickname: string) {
    return this.userRepository.findOne({ where: { nickname } });
  }

  async saveUser(createUserDto: CreateUserReqDto) {
    return this.userRepository.save(createUserDto);
  }

  async findByPlatformId(platform: string, platformId: string) {
    return this.userRepository.findOne({ where: { platform: platform, platformId: platformId } });
  }
}
