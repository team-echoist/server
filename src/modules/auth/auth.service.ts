import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { User } from '../../entities/user.entity';
import { UserResDto } from './dto/userRes.dto';
import { generateJWT } from '../../common/utils/jwt.utils';
import { CheckEmailReqDto } from './dto/checkEamilReq.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * @description
   * 캐싱 테스트를 위해 임시로 코드 추가
   * */
  async validateUser(email: string, password: string): Promise<any> {
    const cacheKey = `auth_${email}`;
    let user = await this.cacheManager.get<User>(cacheKey);

    if (!user) {
      user = await this.authRepository.findByEmail(email);
      if (user) {
        await this.cacheManager.set(cacheKey, user, 600);
      }
    }

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
