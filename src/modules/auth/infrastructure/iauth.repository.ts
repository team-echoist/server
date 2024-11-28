import { User } from '../../../entities/user.entity';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';

export interface IAuthRepository {
  findById(id: number): Promise<User>;

  findByIdWithEmail(payload: any): Promise<User>;

  findByEmail(email: string): Promise<User>;

  findByNickname(nickname: string): Promise<User>;

  saveUser(createUserDto: CreateUserReqDto): Promise<CreateUserReqDto & User>;

  findByPlatformId(platform: string, platformId: string): Promise<User>;
}
