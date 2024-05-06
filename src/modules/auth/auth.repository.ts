import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';

export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserReqDto) {
    return await this.userRepository.save(createUserDto);
  }

  async updateUserOauthInfo(userId: number, oauthInfo: any): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.oauthInfo = { ...user.oauthInfo, ...oauthInfo };
    await this.userRepository.save(user);
  }
}
