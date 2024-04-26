import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { generateJWT } from '../../common/utils/jwt.utils';
import { AuthRepository } from './auth.repository';
import { CheckEmailReqDto } from './dto/checkEamilReq.dto';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { UserResDto } from './dto/userRes.dto';
import Redis from 'ioredis';
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
    const cacheKey = `user_${email}`;

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

  /**
   * @description
   * 캐싱 테스트를 위해 임시로 코드 추가
   * */
  async checkEmail(data: CheckEmailReqDto): Promise<boolean> {
    const cacheKey = `user_${data.email}`;
    const cachedUser = await this.redis.get(cacheKey);

    // 캐시에 이메일이 있다면 예외처리
    if (cachedUser !== null)
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    // 캐시에 없으면 데이터베이스를 확인
    const user = await this.authRepository.findByEmail(data.email);
    if (user) {
      // user 가 있다면 캐싱 후 예외처리
      await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
    return true;
  }

  async register(createUserDto: CreateUserReqDto): Promise<UserResDto> {
    const user = await this.authRepository.findByEmail(createUserDto.email);

    if (user) {
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
