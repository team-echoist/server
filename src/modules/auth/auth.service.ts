import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { UtilsService } from '../utils/utils.service';
import { MailService } from '../mail/mail.service';
import { NicknameService } from '../nickname/nickname.service';
import { AuthRepository } from './auth.repository';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { GoogleUserReqDto } from './dto/request/googleUserReq.dto';
import { OauthDto } from './dto/oauth.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { PasswordResetReqDto } from './dto/request/passwordResetReq.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly utilsService: UtilsService,
    private readonly nicknameService: NicknameService,
    private configService: ConfigService,
  ) {}
  private readonly oauthClient = new OAuth2Client(
    this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
  );

  async checkEmail(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (user) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    return true;
  }

  async checkNickname(nickname: string) {
    const user = await this.authRepository.findByNickname(nickname);
    if (user) throw new HttpException('Nickname already exists', HttpStatus.CONFLICT);
    return;
  }

  async isEmailOwned(email: string) {
    const emailExists = await this.authRepository.findByEmail(email);

    if (emailExists)
      throw new HttpException('Email or nickname is already exists.', HttpStatus.BAD_REQUEST);

    return;
  }

  @Transactional()
  async signingUp(data: CreateUserReqDto) {
    await this.isEmailOwned(data.email);

    const token = await this.utilsService.generateVerifyToken();
    data.password = await bcrypt.hash(data.password, 10);

    await this.redis.set(token, JSON.stringify(data), 'EX', 600);

    await this.mailService.sendVerificationEmail(data.email, token);
  }

  @Transactional()
  async verifEmail(userId: number, email: string) {
    await this.isEmailOwned(email);

    const token = await this.utilsService.generateVerifyToken();

    const userEmailData = { email, userId };

    await this.redis.set(token, JSON.stringify(userEmailData), 'EX', 600);

    await this.mailService.updateEmail(email, token);
  }

  @Transactional()
  async updateEmail(token: string) {
    const userEmailData = await this.redis.get(token);

    if (!userEmailData) throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);

    const { email, userId } = JSON.parse(userEmailData);

    const user = await this.authRepository.findById(userId);

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    user.email = email;
    const updatedUser = await this.authRepository.saveUser(user);

    const cacheKey = `validate_${user.id}`;
    await this.redis.set(cacheKey, JSON.stringify(updatedUser), 'EX', 600);
    return user;
  }

  @Transactional()
  async register(token: string) {
    const user = await this.redis.get(token);
    if (!user) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    const userData = JSON.parse(user);
    userData.nickname = await this.nicknameService.generateUniqueNickname();

    return await this.authRepository.saveUser(userData);
  }

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async validatePayload(id: number) {
    const cacheKey = `validate_${id}`;
    const cachedUser = await this.redis.get(cacheKey);
    let user = cachedUser ? JSON.parse(cachedUser) : null;
    if (!user) {
      user = await this.authRepository.findById(id);
      if (user) {
        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
        return user;
      }
    }
    return !user ? null : user;
  }

  @Transactional()
  async passwordResetReq(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new HttpException('This is an incorrect email.', HttpStatus.BAD_REQUEST);

    const token = await this.utilsService.generateVerifyToken();

    await this.redis.set(token, JSON.stringify(user), 'EX', 600);

    await this.mailService.sendPasswordResetEmail(email, token);
  }

  @Transactional()
  async passwordResetVerify(token: string) {
    const exUser = await this.redis.get(token);
    if (!exUser) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    const user = JSON.parse(exUser);

    const newToken = await this.utilsService.generateVerifyToken();
    await this.redis.set(newToken, JSON.stringify(user), 'EX', 600);

    return newToken;
  }

  @Transactional()
  async passwordReset(data: PasswordResetReqDto) {
    const user = await this.redis.get(data.token);
    if (!user) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    const userData = JSON.parse(user);
    userData.password = await bcrypt.hash(data.password, 10);

    await this.authRepository.saveUser(userData);
  }

  // ----------------- OAuth ---------------------

  async oauthLogin(oauthUser: OauthDto) {
    let user = await this.authRepository.findByEmail(oauthUser.email);
    if (!user) {
      user = await this.authRepository.saveUser({
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
    const ticket = await this.oauthClient.verifyIdToken({
      idToken: data.token,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID,
    });

    const payload = ticket.getPayload();

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
