import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { UserResDto } from './dto/userRes.dto';
import { generateJWT } from '../../common/utils/jwt.utils';
import { CheckEmailReqDto } from './dto/checkEamilReq.dto';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly authRepository: AuthRepository,
  ) {}

  /**
   * @description
   * 캐싱 테스트를 위해 임시로 코드 추가
   * */
  async validateUser(email: string, password: string): Promise<any> {
    const cacheKey = `auth_${email}`;

    // Redis에서 캐시된 사용자 데이터를 조회
    const cachedUser = await this.redis.get(cacheKey);
    let user = cachedUser ? JSON.parse(cachedUser) : null;

    // 캐시에 없는 경우 데이터베이스 조회
    if (!user) {
      user = await this.authRepository.findByEmail(email);
      if (user) {
        // 만약 데이터베이스에 있다면 레디스에 사용자 데이터를 문자열로 캐시
        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
      }
    }

    // 비밀번호를 검증하고 유효한 사용자라면 유저데이터를 반환
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async checkEmail(data: CheckEmailReqDto): Promise<boolean> {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    return true;
  }

  async register(createUserDto: CreateUserReqDto): Promise<UserResDto> {
    const existingUser = await this.authRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    return await this.authRepository.createUser(createUserDto);
  }

  async oauthLogin(user: any) {
    let existingUser: UserResDto = await this.authRepository.findByEmail(user.email);

    if (!existingUser) {
      existingUser = await this.authRepository.createUser({
        email: user.email,
        oauthInfo: { [`${user.platform}Id`]: user.platformId },
      });
    } else {
      if (!existingUser.oauthInfo || !existingUser.oauthInfo[`${user.platform}Id`]) {
        await this.authRepository.updateUserOauthInfo(existingUser.id, {
          [`${user.platform}Id`]: user.platformId,
        });
      }
    }
    return generateJWT(existingUser.id, existingUser.email);
  }
}
