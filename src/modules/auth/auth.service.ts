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
import { PasswordResetReqDto } from './dto/request/passwordResetReq.dto';
import { Transactional } from 'typeorm-transactional';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

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
      throw new HttpException('이메일 또는 닉네임이 이미 사용중입니다.', HttpStatus.BAD_REQUEST);

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

    if (!userEmailData)
      throw new HttpException('유효하지 않거나 만료된 토큰입니다.', HttpStatus.BAD_REQUEST);

    const { email, userId } = JSON.parse(userEmailData);

    const user = await this.authRepository.findById(userId);

    if (!user) throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    user.email = email;
    const updatedUser = await this.authRepository.saveUser(user);

    const cacheKey = `validate_${user.id}`;
    await this.redis.set(cacheKey, JSON.stringify(updatedUser), 'EX', 600);
    return user;
  }

  @Transactional()
  async register(token: string) {
    const user = await this.redis.get(token);
    if (!user)
      throw new HttpException(
        '회원 등록 과정에서 캐싱된 사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );

    const userData = JSON.parse(user);
    userData.nickname = await this.nicknameService.generateUniqueNickname();

    return await this.authRepository.saveUser(userData);
  }

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user)
      throw new HttpException('이메일 혹은 비밀번호가 잘못되었습니다.', HttpStatus.UNAUTHORIZED);

    if (user.platformId !== null && user.platform !== null) {
      throw new HttpException(
        `다음 플랫폼 서비스로 가입한 사용자 입니다. (${user.platform})`,
        HttpStatus.BAD_REQUEST,
      );
    }

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
    if (!user)
      throw new HttpException(
        '요청하신 이메일로 등록된 사용자를 찾을 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );

    const token = await this.utilsService.generateVerifyToken();

    await this.redis.set(token, JSON.stringify(user), 'EX', 600);

    await this.mailService.sendPasswordResetEmail(email, token);
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
  async passwordReset(data: PasswordResetReqDto) {
    const user = await this.redis.get(data.token);
    if (!user) throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    const userData = JSON.parse(user);
    userData.password = await bcrypt.hash(data.password, 10);

    await this.authRepository.saveUser(userData);
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
            '귀하의 계정에 등록된 이메일은 이미 서비스에 사용 중입니다.',
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

    if (!payload || !payload.platformId) {
      throw new HttpException(
        '플랫폼으로부터 올바른 데이터를 받지 못했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oauthDto = new OauthDto();
    oauthDto.platform = 'naver';
    oauthDto.email = payload.email;
    oauthDto.platformId = payload.platformId;

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
