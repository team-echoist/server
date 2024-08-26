// jest.mock('bull');
// jest.mock('../auth.repository');
// jest.mock('../../utils/utils.service');
// jest.mock('../../mail/mail.service');
// jest.mock('../../nickname/nickname.service');
// jest.mock('@nestjs/config');
// jest.mock('@nestjs/axios');
//
// describe('AuthService', () => {
//   let authService: AuthService;
//   let authRepository: jest.Mocked<AuthRepository>;
//   let utilsService: jest.Mocked<UtilsService>;
//   let mailService: jest.Mocked<MailService>;
//   let nicknameService: jest.Mocked<NicknameService>;
//   const mockRedis = {
//     get: jest.fn(),
//     set: jest.fn(),
//     del: jest.fn(),
//     getex: jest.fn(),
//   };
//
//   beforeEach(async () => {
//     const RedisInstance = jest.fn(() => mockRedis);
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [HttpService],
//       providers: [
//         AuthService,
//         AuthRepository,
//         UtilsService,
//         MailService,
//         NicknameService,
//         ConfigService,
//         HttpService,
//         { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
//       ],
//     }).compile();
//
//     authService = module.get<AuthService>(AuthService);
//     authRepository = module.get(AuthRepository);
//     utilsService = module.get(UtilsService);
//     mailService = module.get(MailService);
//     nicknameService = module.get(NicknameService);
//   });
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { UtilsService } from '../../utils/utils.service';
import { MailService } from '../../mail/mail.service';
import { NicknameService } from '../../nickname/nickname.service';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { Request as ExpressRequest } from 'express';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { OauthDto } from '../dto/oauth.dto';

jest.mock('bcrypt');
jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: AuthRepository;
  let utilsService: UtilsService;
  let mailService: MailService;
  let nicknameService: NicknameService;
  let httpService: HttpService;
  let jwtService: JwtService;
  let configService: ConfigService;
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByNickname: jest.fn(),
            findById: jest.fn(),
            saveUser: jest.fn(),
            findByPlatformId: jest.fn(),
            findByIdWithEmail: jest.fn(),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            generateSixDigit: jest.fn(),
            generateVerifyToken: jest.fn(),
            getUUID: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: NicknameService,
          useValue: {
            generateUniqueNickname: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    utilsService = module.get<UtilsService>(UtilsService);
    mailService = module.get<MailService>(MailService);
    nicknameService = module.get<NicknameService>(NicknameService);
    httpService = module.get<HttpService>(HttpService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('이메일 중복 체크', async () => {
    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);

    const result = await authService.checkEmail('test@example.com');

    expect(result).toBe(true);
    expect(authRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('닉네임 중복 체크', async () => {
    jest.spyOn(authRepository, 'findByNickname').mockResolvedValue(null);

    const result = await authService.checkNickname('testNickname');

    expect(result).toBeUndefined();
    expect(authRepository.findByNickname).toHaveBeenCalledWith('testNickname');
  });

  it('회원가입 과정에서 이메일이 이미 사용 중이면 예외를 발생', async () => {
    const mockUser = { id: 1 } as any;
    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(mockUser);

    await expect(authService.checkEmail('test@example.com')).rejects.toThrow(
      new HttpException('사용중인 이메일 입니다.', HttpStatus.CONFLICT),
    );
  });

  it('회원가입을 처리하고, 이메일로 인증 코드 발송', async () => {
    const mockReq = { ip: '127.0.0.1' } as ExpressRequest;
    const mockDto = { email: 'test@example.com', password: 'password123' } as CreateUserReqDto;

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(utilsService, 'generateSixDigit').mockReturnValue('123456' as any);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');
    jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(undefined);

    await authService.signingUp(mockReq, mockDto);

    expect(authRepository.findByEmail).toHaveBeenCalledWith(mockDto.email);
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(redis.set).toHaveBeenCalledWith(
      `${mockReq.ip}:123456`,
      JSON.stringify({ ...mockDto, password: 'hashed_password' }),
      'EX',
      300,
    );
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(mockDto.email, '123456');
  });

  it('로그인을 처리하고 JWT 토큰 반환', async () => {
    const mockReq = {
      user: { email: 'test@example.com', id: 1 },
    } as ExpressRequest;
    jest.spyOn(jwtService, 'sign').mockReturnValue('token');

    const result = await authService.login(mockReq);

    expect(jwtService.sign).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      accessToken: 'token',
      refreshToken: 'token',
    });
  });

  it('OAuth 유저를 검증하고 로그인', async () => {
    const oauthUser = {
      platform: 'google',
      platformId: '123',
      email: 'test@example.com',
    } as OauthDto;
    jest.spyOn(authRepository, 'findByPlatformId').mockResolvedValue(null);
    jest.spyOn(nicknameService, 'generateUniqueNickname').mockResolvedValue('uniqueNickname');
    jest.spyOn(authRepository, 'saveUser').mockResolvedValue(oauthUser as any);

    const result = await authService.oauthLogin(oauthUser);

    expect(authRepository.findByPlatformId).toHaveBeenCalledWith(
      oauthUser.platform,
      oauthUser.platformId,
    );
    expect(authRepository.saveUser).toHaveBeenCalledWith({
      email: oauthUser.email,
      platform: oauthUser.platform,
      platformId: oauthUser.platformId,
      nickname: 'uniqueNickname',
    });
    expect(result).toEqual(oauthUser);
  });

  it('이메일 소유권을 확인', async () => {
    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);

    const result = await authService.isEmailOwned('test@example.com');

    expect(result).toBeUndefined();
    expect(authRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('이메일 소유권이 있을 경우 예외', async () => {
    const mockUser = { id: 1 } as any;
    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(mockUser);

    await expect(authService.isEmailOwned('test@example.com')).rejects.toThrow(
      new HttpException('이미 사용중인 이메일 입니다.', HttpStatus.BAD_REQUEST),
    );
  });

  it('이메일 인증 요청을 처리하고 인증 코드를 발송', async () => {
    const mockReq = { ip: '127.0.0.1', user: { id: 1 } } as ExpressRequest;
    const mockEmail = 'test@example.com';

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(utilsService, 'generateSixDigit').mockReturnValue('123456' as any);
    jest.spyOn(utilsService, 'generateVerifyToken').mockReturnValue('testToken' as any);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');
    jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(undefined);

    await authService.verifyEmail(mockReq, mockEmail);

    expect(redis.set).toHaveBeenCalledWith(
      `${mockReq.ip}:123456`,
      JSON.stringify({ email: mockEmail, userId: mockReq.user.id }),
      'EX',
      300,
    );
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(mockEmail, 'testToken');
  });

  it('이메일을 업데이트하고 인증 코드를 확인', async () => {
    const mockReq = { ip: '127.0.0.1' } as ExpressRequest;
    const mockCode = '123456';
    const mockUserEmailData = { email: 'test@example.com', userId: 1 };
    const mockUser = { id: 1, email: 'old@example.com' } as any;

    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockUserEmailData));
    jest.spyOn(authRepository, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(authRepository, 'saveUser').mockResolvedValue(mockUser);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');

    const result = await authService.updateEmail(mockReq, mockCode);

    expect(authRepository.findById).toHaveBeenCalledWith(mockUserEmailData.userId);
    expect(authRepository.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
    );
    expect(redis.set).toHaveBeenCalledWith(
      `validate_${mockUser.id}`,
      JSON.stringify(mockUser),
      'EX',
      600,
    );
    expect(result).toEqual(mockUser);
  });

  it('회원 등록을 처리하고 로그인', async () => {
    const mockReq = { ip: '127.0.0.1', user: {} } as ExpressRequest;
    const mockCode = '123456';
    const mockUser = { email: 'test@example.com', password: 'hashed_password' } as any;

    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockUser));
    jest.spyOn(nicknameService, 'generateUniqueNickname').mockResolvedValue('nickname');
    jest.spyOn(authRepository, 'saveUser').mockResolvedValue(mockUser);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await authService.register(mockReq, mockCode);

    expect(redis.get).toHaveBeenCalledWith(`${mockReq.ip}:${mockCode}`);
    expect(nicknameService.generateUniqueNickname).toHaveBeenCalled();
    expect(authRepository.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: 'nickname' }),
    );
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('비밀번호 재설정 요청을 처리하고 인증 코드를 발송', async () => {
    const mockReq = { ip: '127.0.0.1' } as ExpressRequest;
    const mockEmail = 'test@example.com';
    const mockUser = { id: 1, email: mockEmail } as any;

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(utilsService, 'generateSixDigit').mockReturnValue('123456' as any);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');
    jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(undefined);

    await authService.passwordResetReq(mockReq, mockEmail);

    expect(authRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
    expect(redis.set).toHaveBeenCalledWith(
      `${mockReq.ip}:123456`,
      JSON.stringify(mockUser),
      'EX',
      300,
    );
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(mockEmail, '123456');
  });

  it('비밀번호 재설정 검증을 처리하고 새로운 토큰을 발급', async () => {
    const mockToken = 'reset-token';
    const mockUser = { id: 1, email: 'test@example.com' };

    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockUser));
    jest.spyOn(utilsService, 'generateVerifyToken').mockReturnValue('new-token' as any);
    jest.spyOn(redis, 'set').mockResolvedValue('OK');

    const result = await authService.passwordResetVerify(mockToken);

    expect(redis.get).toHaveBeenCalledWith(mockToken);
    expect(utilsService.generateVerifyToken).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalledWith('new-token', JSON.stringify(mockUser), 'EX', 600);
    expect(result).toBe('new-token');
  });

  it('비밀번호를 재설정하고 이메일로 알림 발송', async () => {
    const mockEmail = 'test@example.com';
    const mockUser = { id: 1, email: mockEmail, password: 'hashed_password' } as any;

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(utilsService, 'getUUID').mockReturnValue('temporary-password');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);
    jest.spyOn(authRepository, 'saveUser').mockResolvedValue(mockUser);
    jest.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);

    await authService.passwordReset(mockEmail);

    expect(authRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
    expect(bcrypt.hash).toHaveBeenCalledWith('temporary-password', 12);
    expect(authRepository.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'new-hashed-password' }),
    );
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      mockEmail,
      'temporary-password',
    );
  });

  it('Kakao OAuth 유저 검증', async () => {
    const token = 'kakao-token';
    const response = {
      data: {
        id: 'kakao-id',
        kakao_account: { email: 'test@kakao.com' },
      },
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(response) as any);
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue({ id: 1 } as any);

    const result = await authService.validateKakaoUser(token);

    expect(httpService.post).toHaveBeenCalledWith('https://kapi.kakao.com/v2/user/me', null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(authService.oauthLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'kakao',
        platformId: 'kakao-id',
        email: 'test@kakao.com',
      }),
    );
    expect(result).toEqual({ id: 1 });
  });

  it('Naver OAuth 유저 검증', async () => {
    const token = 'naver-token';
    const response = {
      data: {
        response: { id: 'naver-id', email: 'test@naver.com' },
      },
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(response) as any);
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue({ id: 1 } as any);

    const result = await authService.validateNaverUser(token);

    expect(httpService.get).toHaveBeenCalledWith('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(authService.oauthLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'naver',
        platformId: 'naver-id',
        email: 'test@naver.com',
      }),
    );
    expect(result).toEqual({ id: 1 });
  });

  it('Apple OAuth 유저 검증', async () => {
    const token = 'apple-token';
    const decodedIdToken = { sub: 'apple-id', email: 'test@apple.com' };

    jest.spyOn(authService, 'verifyAppleIdToken').mockResolvedValue(decodedIdToken);
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue({ id: 1 } as any);

    const result = await authService.validateAppleUser(token);

    expect(authService.verifyAppleIdToken).toHaveBeenCalledWith(token);
    expect(authService.oauthLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'apple',
        platformId: 'apple-id',
        email: 'test@apple.com',
      }),
    );
    expect(result).toEqual({ id: 1 });
  });
});
