import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../core/auth.service';
import { AuthRepository } from '../infrastructure/auth.repository';
import { ToolService } from '../../../utils/tool/tool.service';
import { MailService } from '../../../utils/mail/mail.service';
import { NicknameService } from '../../../utils/nickname/nickname.service';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HomeService } from '../../../features/account/home/home.service';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../../common/types/enum.types';

jest.mock('bcrypt');
jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../infrastructure/auth.repository');
jest.mock('../../util/util.service');
jest.mock('../../mail/mail.service');
jest.mock('../../nickname/nickname.service');
jest.mock('../../home/home.service');
jest.mock('@nestjs/axios');
jest.mock('@nestjs/config');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let utilsService: jest.Mocked<ToolService>;
  let mailService: jest.Mocked<MailService>;
  let nicknameService: jest.Mocked<NicknameService>;
  let homeService: jest.Mocked<HomeService>;
  let httpService: jest.Mocked<HttpService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
    keys: jest.fn(),
  };

  let code: string;
  let email: string;
  let password: string;
  let user: any;
  let req: any;
  let atPayload: any;
  let rtPayload: any;

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => redis);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useClass: AuthRepository },
        { provide: ToolService, useClass: ToolService },
        { provide: MailService, useClass: MailService },
        { provide: NicknameService, useClass: NicknameService },
        { provide: HttpService, useClass: HttpService },
        { provide: JwtService, useClass: JwtService },
        { provide: ConfigService, useClass: ConfigService },
        { provide: HomeService, useClass: HomeService },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository) as jest.Mocked<AuthRepository>;
    utilsService = module.get(ToolService) as jest.Mocked<ToolService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    nicknameService = module.get(NicknameService) as jest.Mocked<NicknameService>;
    homeService = module.get(HomeService) as jest.Mocked<HomeService>;
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    utilsService.transformToDto.mockImplementation((_, any) => any);

    code = '123456';
    email = 'test@example.com';
    password = '1234';
    user = {
      id: 1,
      email,
      password: 'hashedPassword',
      platformId: null,
      platform: null,
      status: null,
      tokenVersion: 1,
    };
    req = { ip: '127.0.0.1', user, device: 'device123' };
    atPayload = { username: user.email, sub: user.id };
    rtPayload = {
      username: user.email,
      sub: user.id,
      tokenVersion: user.version,
      device: req.device,
    };
  });

  describe('checkEmail', () => {
    it('사용중인 이메일', async () => {
      authRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.checkEmail(email)).rejects.toThrow(
        new HttpException('사용중인 이메일 입니다.', HttpStatus.CONFLICT),
      );
    });

    it('사용가능 이메일', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.checkEmail(email)).resolves.toBe(true);
    });
  });

  describe('checkNickname', () => {
    const nickname = 'test';
    it('닉네임 사용 가능', async () => {
      authRepository.findByNickname.mockResolvedValue(null);

      await expect(authService.checkNickname(nickname)).resolves.toBe(true);
    });
    it('닉네임 사용 불가', async () => {
      authRepository.findByNickname.mockResolvedValue(user);

      await expect(authService.checkNickname(nickname)).rejects.toThrow(
        new HttpException('사용중인 닉네임 입니다.', HttpStatus.CONFLICT),
      );
    });
  });

  describe('signinUp', () => {
    const data = {
      email: email,
      password: '1234',
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(authService, 'checkEmail').mockResolvedValue(true);
      utilsService.generateSixDigit = jest.fn().mockReturnValue(code);
      mailService.sendVerificationEmail = jest.fn().mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('회원가입 신청 완료', async () => {
      await authService.signingUp(req, data);

      expect(authService.checkEmail).toHaveBeenCalledWith(data.email);
      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 12);
      expect(utilsService.generateSixDigit).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        `${req.ip}:123456`,
        JSON.stringify({ ...data, password: 'hashedPassword' }),
        'EX',
        300,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(data.email, '123456');
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(authService, 'checkEmail').mockResolvedValue(true);
      utilsService.generateSixDigit = jest.fn().mockReturnValue(code);
      redis.keys = jest.fn().mockResolvedValue([]); // 기존 Redis 키가 없다고 가정
      redis.set = jest.fn().mockResolvedValue('OK');
      mailService.sendVerificationEmail = jest.fn().mockResolvedValue(undefined);
    });

    it('이메일변경 이메일 검증메일 발송', async () => {
      await authService.verifyEmail(req, email);

      expect(authService.checkEmail).toHaveBeenCalledWith(email);

      expect(utilsService.generateSixDigit).toHaveBeenCalled();

      expect(redis.set).toHaveBeenCalledWith(
        `${req.ip}:${code}`,
        JSON.stringify({ email, userId: req.user.id }),
        'EX',
        300,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(email, '123456');
    });

    it('기존 인증 코드가 있을 경우 삭제하고 새로 저장', async () => {
      // Mock 설정: 기존 Redis 키가 있을 경우
      redis.keys = jest.fn().mockResolvedValue(['existingKey']);
      redis.del = jest.fn().mockResolvedValue(1);

      await authService.verifyEmail(req, email);

      expect(redis.del).toHaveBeenCalledWith(['existingKey']);

      expect(redis.set).toHaveBeenCalledWith(
        `${req.ip}:${code}`,
        JSON.stringify({ email, userId: req.user.id }),
        'EX',
        300,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(email, '123456');
    });
  });

  describe('updateEmail', () => {
    beforeEach(() => {
      redis.get = jest.fn().mockResolvedValue(JSON.stringify({ email: email, userId: user.id }));
      authRepository.findById = jest.fn().mockResolvedValue(user);
      authRepository.saveUser = jest.fn().mockResolvedValue(user);
    });

    it('이메일변경: 이메일 업데이트 성공', async () => {
      const result = await authService.updateEmail(req, code);

      expect(redis.get).toHaveBeenCalledWith(`${req.ip}:${code}`);
      expect(authRepository.findById).toHaveBeenCalledWith(user.id);
      expect(authRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: user.email }),
      );
      expect(result).toEqual(user);
    });

    it('이메일변경: 유효하지 않거나 만료된 코드로 요청 시 예외 처리', async () => {
      redis.get = jest.fn().mockResolvedValue(null);

      await expect(authService.updateEmail(req, code)).rejects.toThrow(
        new HttpException('유효하지 않거나 만료된 요청입니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('이메일변경: 변경할 레코드가 존재하지 않는 경우 예외 처리', async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(authService.updateEmail(req, code)).rejects.toThrow(
        new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('register', () => {
    const userData = { ...user, nickname: 'nickname' } as any;

    it('회원가입: 회원 등록 대기시간 초과', async () => {
      redis.get.mockResolvedValue(null);

      await expect(authService.register(req, email)).rejects.toThrow(
        new HttpException('회원 등록 과정에서 오류가 발생했습니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('회원가입: 회원 등록 성공', async () => {
      redis.get.mockResolvedValue(JSON.stringify(user));
      nicknameService.generateUniqueNickname.mockResolvedValue('nickname');
      authRepository.saveUser.mockResolvedValue(userData);

      await authService.register(req, code);

      expect(redis.get).toHaveBeenCalledWith(`${req.ip}:${code}`);
      expect(nicknameService.generateUniqueNickname).toHaveBeenCalled();
      expect(authRepository.saveUser).toHaveBeenCalledWith(expect.objectContaining(userData));
      expect(homeService.createDefaultTheme).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('validateUser', () => {
    it('로그인: 존재하지 않는 계정', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        new HttpException('존재하지 않는 계정입니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('로그인: 다른 플랫폼 가입자', async () => {
      user.platformId = '1';
      user.platform = 'google';
      authRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        new HttpException(
          `다른 플랫폼 서비스로 가입한 사용자 입니다.(${user.platform})`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('로그인: 잘못된 이메일&비밀번호', async () => {
      authRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        new HttpException('이메일 혹은 비밀번호가 잘못되었습니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('로그인: 정지된 계정', async () => {
      user.status = UserStatus.BANNED;
      authRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        new HttpException(
          '정지된 계정입니다. 자세한 내용은 지원팀에 문의하세요.',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
    it('로그인: 인증 성공', async () => {
      authRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(email, password);

      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      authService.generateAccessToken = jest.fn().mockResolvedValue('at123');
      authService.generateRefreshToken = jest.fn().mockResolvedValue('rt123');
      redis.set = jest.fn().mockResolvedValue('OK');
    });

    it('로그인: AT, RT 발급', async () => {
      const result = await authService.login(req);

      expect(authService.generateAccessToken).toHaveBeenCalledWith({
        username: req.user.email,
        sub: req.user.id,
      });
      expect(authService.generateRefreshToken).toHaveBeenCalledWith({
        username: req.user.email,
        sub: req.user.id,
        device: req.device,
        tokenVersion: req.user.tokenVersion,
      });
      expect(redis.set).toHaveBeenCalledWith(`rt123:${req.user.id}`, 'used', 'EX', 29 * 60 + 50);
      expect(result).toEqual({
        accessToken: 'at123',
        refreshToken: 'rt123',
      });
    });
  });

  describe('generateAccessToken', () => {
    it('AT생성', async () => {
      jwtService.sign.mockReturnValue('at123');

      await expect(authService.generateAccessToken(atPayload)).resolves.toBe('at123');
    });
  });

  describe('generateRefreshToken', () => {
    it('RT생성', async () => {
      jwtService.sign.mockReturnValue('rt123');

      await expect(authService.generateRefreshToken(rtPayload)).resolves.toBe('rt123');
    });
  });

  describe('refreshToken', () => {
    it('RT사용', async () => {
      const rt = 'rt123';
      const secret = 'secret';

      configService.get.mockReturnValue(secret);
      jwtService.verify.mockReturnValue(rtPayload);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('at123');

      await authService.refreshToken(rt);

      expect(jwtService.verify).toHaveBeenCalledWith(rt, { secret });
      expect(authService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining(atPayload),
      );
    });
  });

  describe('validatePayload', () => {
    it('페이로드검증: 캐시가없다면', async () => {
      redis.get.mockResolvedValue(JSON.stringify(null));
      redis.set.mockResolvedValue(true);
      authRepository.findByIdWithEmail.mockResolvedValue(user);

      const result = await authService.validatePayload(atPayload);

      expect(authRepository.findByIdWithEmail).toHaveBeenCalledWith(atPayload);
      expect(redis.set).toHaveBeenCalledWith(
        `user:${atPayload.sub}`,
        JSON.stringify(user),
        'EX',
        600,
      );
      expect(result).toEqual(user);
    });

    it('페이로드검증: 캐시가있다면', async () => {
      redis.get.mockResolvedValue(JSON.stringify(user));

      const result = await authService.validatePayload(atPayload);

      expect(result).toEqual(user);
    });
  });

  describe('incrementTokenVersion', () => {
    it('인가: 토큰버전증감', async () => {
      authRepository.saveUser.mockResolvedValue({ ...user, tokenVersion: 2 });
      await authService.incrementTokenVersion(user);

      expect(authRepository.saveUser).toHaveBeenCalledWith({ ...user, tokenVersion: 2 });
    });
  });

  describe('passwordReset', () => {
    it('비밀번호리셋: 실패', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.passwordReset(user.email)).rejects.toThrow(
        new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );
    });

    it('비밀번호리셋: 임시비번발송', async () => {
      authRepository.findByEmail.mockResolvedValue(user);
      utilsService.getUUID.mockReturnValue('1234');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await authService.passwordReset(user.email);

      expect(authRepository.saveUser).toHaveBeenCalledWith({ ...user, password: `hashedPassword` });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(user.email, '1234');
    });
  });

  describe('oauthLogin', () => {
    it('소셜로그인: 올바르지 않은 플랫폼', async () => {
      await expect(authService.oauthLogin(user)).rejects.toThrow(
        new HttpException('플랫폼 정보가 올바르지 않습니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it('소셜로그인: 타 플랫폼 가입자', async () => {
      user.platform = 'google';
      user.platformId = '1';

      authRepository.findByPlatformId.mockReturnValue(null);
      authRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.oauthLogin(user)).rejects.toThrow(
        new HttpException('귀하의 계정에 등록된 이메일은 이미 사용 중입니다.', HttpStatus.CONFLICT),
      );
    });

    it('소셜로그인: 신규유저', async () => {
      user.platform = 'google';
      user.platformId = '1';

      authRepository.findByPlatformId.mockReturnValue(null);
      authRepository.findByEmail.mockResolvedValue(null);
      nicknameService.generateUniqueNickname.mockResolvedValue('nickname');
      authRepository.saveUser.mockResolvedValue(user);

      const result = await authService.oauthLogin(user);

      expect(authRepository.findByPlatformId).toHaveBeenCalledWith(user.platform, user.platformId);
      expect(nicknameService.generateUniqueNickname).toHaveBeenCalled();
      expect(authRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: user.email,
          platform: user.platform,
          platformId: user.platformId,
          nickname: 'nickname',
        }),
      );
      expect(result).toEqual(user);
    });

    it('소셜로그인: 기존유저', async () => {
      user.platform = 'google';
      user.platformId = '1';

      authRepository.findByPlatformId.mockReturnValue(user);

      const result = await authService.oauthLogin(user);

      expect(authRepository.findByPlatformId).toHaveBeenCalledWith(user.platform, user.platformId);
      expect(result).toEqual(user);
    });
  });
});
