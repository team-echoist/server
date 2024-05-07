import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { generateToken } from '../../common/utils/verify.utils';
import { AuthRepository } from './auth.repository';
import { MailService } from '../mail/mail.service';
import { CheckEmailReqDto } from './dto/request/checkEamilReq.dto';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { UserResDto } from './dto/response/userRes.dto';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { OauthDto } from './dto/oauth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
  ) {}

  async checkEmail(email: string): Promise<boolean> {
    const user = await this.authRepository.findByEmail(email);
    if (user) throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    return true;
  }

  async isEmailOwned(createUserDto: CreateUserReqDto) {
    const email = createUserDto.email;
    const userExists = await this.authRepository.findByEmail(email);

    if (userExists) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const token = await generateToken();
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    await this.redis.set(token, JSON.stringify(createUserDto), 'EX', 600);

    await this.mailService.sendVerificationEmail(email, token);

    return;
  }

  async register(token: string) {
    const user = await this.redis.get(token);
    if (!user) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    return await this.authRepository.createUser(JSON.parse(user));
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.authRepository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async validatePayload(email: string) {
    const cacheKey = `validate_${email}`;
    const cachedUser = await this.redis.get(cacheKey);
    let user = cachedUser ? JSON.parse(cachedUser) : null;
    if (!user) {
      user = await this.authRepository.findByEmail(email);
      if (user) {
        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
        return user;
      }
    }
    return !user ? null : user;
  }

  // ----------------- OAuth ---------------------

  async oauthLogin(oauthUser: OauthDto) {
    let user = await this.authRepository.findByEmail(oauthUser.email);
    if (!user) {
      user = await this.authRepository.createUser({
        email: oauthUser.email,
        oauthInfo: { [`${oauthUser.platform}Id`]: oauthUser.platformId },
      });
    } else {
      if (!user.oauthInfo || !user.oauthInfo[`${oauthUser.platform}Id`]) {
        await this.authRepository.updateUserOauthInfo(user.id, {
          [`${oauthUser.platform}Id`]: oauthUser.platformId,
        });
      }
    }
    return user;
  }
}
