import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { generateToken } from '../../common/utils/verify.utils';
import { AuthRepository } from './auth.repository';
import { MailService } from '../mail/mail.service';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { GoogleUserReqDto } from './dto/request/googleUserReq.dto';
import { OauthDto } from './dto/oauth.dto';
import { OAuth2Client } from 'google-auth-library';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
  ) {}
  private readonly oauthClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);

  async checkEmail(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (user) throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    return;
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

  async validateGoogleUser(data: GoogleUserReqDto) {
    console.log(process.env.GOOGLE_ANDROID_CLIENT_ID);
    const ticket = await this.oauthClient.verifyIdToken({
      idToken: data.token,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log(payload);
    if (!payload) {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const oauthDto = new OauthDto();
    oauthDto.platform = 'google';
    oauthDto.email = payload.email;
    oauthDto.platformId = data.id;

    return await this.oauthLogin(oauthDto);
  }
}
