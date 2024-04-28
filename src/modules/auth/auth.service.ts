import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { generateJWT } from '../../common/utils/jwt.utils';
import { generateToken } from '../../common/utils/verify.utils';
import { AuthRepository } from './auth.repository';
import { MailService } from '../mail/mail.service';
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
    private readonly mailService: MailService,
  ) {}

  async checkEmail(data: CheckEmailReqDto): Promise<boolean> {
    const user = await this.authRepository.findByEmail(data.email);
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

  async register(token: string): Promise<UserResDto> {
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
    return null;
  }

  // ----------------- OAuth ---------------------

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
