import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { UtilsService } from '../utils/utils.service';
import { MailService } from '../mail/mail.service';
import { NicknameService } from '../nickname/nickname.service';
import { AuthRepository } from './auth.repository';
import { CreateUserReqDto } from './dto/request/createUserReq.dto';
import { OauthDto } from './dto/oauth.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { Transactional } from 'typeorm-transactional';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '../../common/types/enum.types';
import { Request as ExpressRequest } from 'express';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly utilsService: UtilsService,
    private readonly nicknameService: NicknameService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly oauthClient = new OAuth2Client(
    this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
  );

  async checkEmail(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (user) throw new HttpException('사용중인 이메일 입니다.', HttpStatus.CONFLICT);
    return true;
  }

  async checkNickname(nickname: string) {
    const user = await this.authRepository.findByNickname(nickname);
    if (user) throw new HttpException('사용중인 닉네임 입니다.', HttpStatus.CONFLICT);
    return;
  }

  async isEmailOwned(email: string) {
    const emailExists = await this.authRepository.findByEmail(email);

    if (emailExists)
      throw new HttpException('이미 사용중인 이메일 입니다.', HttpStatus.BAD_REQUEST);

    return;
  }

  @Transactional()
  async signingUp(req: ExpressRequest, data: CreateUserReqDto) {
    await this.isEmailOwned(data.email);

    const code = await this.utilsService.generateSixDigit();
    data.password = await bcrypt.hash(data.password, 10);

    await this.redis.set(`${req.ip}:${code}`, JSON.stringify(data), 'EX', 300);

    await this.mailService.sendVerificationEmail(data.email, code);
  }

  @Transactional()
  async verifyEmail(req: ExpressRequest, email: string) {
    await this.isEmailOwned(email);

    const userId = req.user.id;
    const code = await this.utilsService.generateSixDigit();

    const userEmailData = { email, userId };

    const existingCodeKey = await this.redis.keys(`${req.ip}:*`);
    if (existingCodeKey.length > 0) {
      await this.redis.del(existingCodeKey);
    }

    await this.redis.set(`${req.ip}:${code}`, JSON.stringify(userEmailData), 'EX', 300);
    await this.mailService.sendVerificationEmail(email, code);
  }

  @Transactional()
  async updateEmail(req: ExpressRequest, code: string) {
    const userEmailData = await this.redis.get(`${req.ip}:${code}`);

    if (!userEmailData)
      throw new HttpException('유효하지 않거나 만료된 요청입니다.', HttpStatus.BAD_REQUEST);

    const { email, userId } = JSON.parse(userEmailData);

    const user = await this.authRepository.findById(userId);

    if (!user) throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    user.email = email;
    await this.authRepository.saveUser(user);

    return user;
  }

  @Transactional()
  async register(req: ExpressRequest, code: string) {
    const user = await this.redis.get(`${req.ip}:${code}`);
    if (!user)
      throw new HttpException('회원 등록 과정에서 오류가 발생했습니다.', HttpStatus.BAD_REQUEST);

    const userData = JSON.parse(user);
    userData.nickname = await this.nicknameService.generateUniqueNickname();

    req.user = await this.authRepository.saveUser(userData);
    return await this.login(req);
  }

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new HttpException('이메일 혹은 비밀번호가 잘못되었습니다.', HttpStatus.BAD_REQUEST);
    }

    if (user.platformId !== null && user.platform !== null) {
      throw new HttpException(
        `다른 플랫폼 서비스로 가입한 사용자 입니다.(${user.platform})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
      throw new HttpException('이메일 혹은 비밀번호가 잘못되었습니다.', HttpStatus.BAD_REQUEST);

    if (user.status === UserStatus.BANNED) {
      throw new HttpException(
        '정지된 계정입니다. 자세한 내용은 지원팀에 문의하세요.',
        HttpStatus.FORBIDDEN,
      );
    }

    return user;
  }

  async login(req: ExpressRequest) {
    const accessPayload = { username: req.user.email, sub: req.user.id };
    const refreshPayload = {
      username: req.user.email,
      sub: req.user.id,
      device: req.device,
      tokenVersion: req.user.tokenVersion,
    };

    const refreshToken = await this.generateRefreshToken(refreshPayload);
    await this.redis.set(`${refreshToken}:${req.user.id}`, 'used', 'EX', 29 * 60 + 50);

    return {
      accessToken: await this.generateAccessToken(accessPayload),
      refreshToken: refreshToken,
    };
  }

  async generateAccessToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '30m',
    });
  }

  async generateRefreshToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }

  async refreshToken(refreshToken: string) {
    let payload = await this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    payload = { username: payload.username, sub: payload.sub };

    return await this.generateAccessToken(payload);
  }

  async validatePayload(payload: any) {
    const cacheKey = `user:${payload.sub}`;
    const cachedUser = await this.redis.get(cacheKey);

    let user = cachedUser ? JSON.parse(cachedUser) : null;

    if (!user) {
      user = await this.authRepository.findByIdWithEmail(payload);
      if (user) {
        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
        return user;
      }
    }

    return !user ? null : user;
  }

  @Transactional()
  async incrementTokenVersion(user: User) {
    user.tokenVersion += 1;
    await this.authRepository.saveUser(user);
  }

  @Transactional()
  async passwordResetReq(req: ExpressRequest, email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user)
      throw new HttpException(
        '요청하신 이메일로 등록된 사용자를 찾을 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );

    const code = await this.utilsService.generateSixDigit();

    await this.redis.set(`${req.ip}:${code}`, JSON.stringify(user), 'EX', 300);

    await this.mailService.sendVerificationEmail(email, code);
  }

  @Transactional()
  async passwordResetVerify(token: string) {
    const exUser = await this.redis.get(token);
    if (!exUser)
      throw new HttpException(
        '비밀번호 초기화 과정에서 사용자 정보를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    const user = JSON.parse(exUser);

    const newToken = await this.utilsService.generateVerifyToken();
    await this.redis.set(newToken, JSON.stringify(user), 'EX', 600);

    return newToken;
  }

  @Transactional()
  async passwordReset(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    const temporaryPassword = this.utilsService.getUUID();
    user.password = await bcrypt.hash(temporaryPassword, 12);

    await this.authRepository.saveUser(user);

    await this.mailService.sendPasswordResetEmail(email, temporaryPassword);
  }

  // ----------------- OAuth ---------------------

  @Transactional()
  async oauthLogin(oauthUser: OauthDto) {
    if (oauthUser.platformId === undefined || oauthUser.platform === null)
      throw new HttpException('플랫폼 정보가 올바르지 않습니다.', HttpStatus.BAD_REQUEST);

    let user = await this.authRepository.findByPlatformId(oauthUser.platform, oauthUser.platformId);

    if (!user) {
      if (oauthUser.email) {
        const emailUser = await this.authRepository.findByEmail(oauthUser.email);
        if (emailUser) {
          throw new HttpException(
            '귀하의 계정에 등록된 이메일은 이미 사용 중입니다.',
            HttpStatus.CONFLICT,
          );
        }
      }
      const nickname = await this.nicknameService.generateUniqueNickname();
      user = await this.authRepository.saveUser({
        email: oauthUser.email || null,
        platform: oauthUser.platform,
        platformId: oauthUser.platformId,
        nickname: nickname,
      });
    }

    return user;
  }

  async validateGoogleUser(token: string) {
    const ticket = await this.oauthClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new HttpException(
        '플랫폼으로부터 올바른 데이터를 받지 못했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oauthDto = new OauthDto();
    oauthDto.platform = 'google';
    oauthDto.email = payload.email;
    oauthDto.platformId = payload.sub;

    return await this.oauthLogin(oauthDto);
  }

  async validateKakaoUser(token: string) {
    const response = await firstValueFrom(
      this.httpService.post('https://kapi.kakao.com/v2/user/me', null, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    const payload = response.data;

    if (!payload) {
      throw new HttpException(
        '플랫폼으로부터 올바른 데이터를 받지 못했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oauthDto = new OauthDto();
    oauthDto.platform = 'kakao';
    oauthDto.email = payload.kakao_account.email;
    oauthDto.platformId = payload.id;

    return await this.oauthLogin(oauthDto);
  }

  async validateNaverUser(token: string) {
    const response = await firstValueFrom(
      this.httpService.get('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    const payload = response.data.response;
    if (!payload || !payload.id) {
      throw new HttpException(
        '플랫폼으로부터 올바른 데이터를 받지 못했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oauthDto = new OauthDto();
    oauthDto.platform = 'naver';
    oauthDto.email = payload.email;
    oauthDto.platformId = payload.id;

    return await this.oauthLogin(oauthDto);
  }

  async validateAppleUser(token: string) {
    const decodedIdToken = await this.verifyAppleIdToken(token);

    const oauthDto = new OauthDto();
    oauthDto.platform = 'apple';
    oauthDto.platformId = decodedIdToken.sub;
    oauthDto.email = decodedIdToken.email || null;

    return await this.oauthLogin(oauthDto);
  }

  async verifyAppleIdToken(idToken: string): Promise<any> {
    const decodedHeader: any = jwt.decode(idToken, { complete: true });

    if (!decodedHeader || !decodedHeader.header) {
      throw new HttpException(
        '플랫폼으로부터 올바른 데이터를 받지 못했습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const publicKey = await this.getApplePublicKey(decodedHeader.header.kid);

    return new Promise((resolve, reject) => {
      jwt.verify(idToken, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          return reject(new HttpException('토큰 검증에 실패했습니다.', HttpStatus.UNAUTHORIZED));
        }
        resolve(decoded);
      });
    });
  }

  private client = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });

  async getApplePublicKey(kid: string): Promise<string> {
    const key = await this.client.getSigningKey(kid);
    return key.getPublicKey();
  }
}
