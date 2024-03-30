import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { plainToInstance } from 'class-transformer';
import { UserResDto } from './dto/userRes.dto';

export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserReqDto): Promise<UserResDto> {
    const user = await this.userRepository.save(createUserDto);
    return plainToInstance(UserResDto, user);
  }

  async updateUserOauthInfo(userId: number, oauthInfo: any): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.oauthInfo = { ...user.oauthInfo, ...oauthInfo };
    await this.userRepository.save(user);
  }
}
