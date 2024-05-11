import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { User } from '../../../entities/user.entity';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { UtilsService } from '../../utils/utils.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let authService: AuthService;
  const mockAuthRepository = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockUtilsService = {
    generateJWT: jest.fn(),
    generateVerifyToken: jest.fn(() => 'verify token'),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
        { provide: MailService, useValue: mockMailService },
        { provide: UtilsService, useValue: mockUtilsService },
        ConfigService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('checkEmail', () => {
    it('사용중인 이메일이라면 예외처리', async () => {
      const email = 'user@example.com';
      const user = new User();

      mockAuthRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.checkEmail(email)).rejects.toThrow(HttpException);
    });

    it('사용할 수 있는 이메일이면', async () => {
      const email = 'user@example.com';

      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.checkEmail(email);

      expect(result).toEqual(undefined);
    });
  });

  describe('isEmailOwned', () => {
    it('이메일 중복 재검사 후 토큰을 생성해 캐싱하고 메일서비스 호출', async () => {
      const user = new CreateUserReqDto();
      user.email = 'test@example.com';
      user.password = '1234';

      await authService.isEmailOwned(user);

      expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 600);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
      );
    });
  });

  describe('register', () => {
    it('클라이언트가 인증링크를 클릭하면 토큰 검증 후 회원등록 완료', async () => {
      const user = 'user';
      const token = 'token';

      mockRedis.get.mockResolvedValue(user);
      const result = await mockRedis.get(token);

      expect(result).toEqual(user);
      expect(mockRedis.get).toHaveBeenCalledWith(token);
    });
  });

  describe('validateUser', () => {
    it('이메일로 유저를 찾을 수 없으면 null 반환', async () => {
      const email = 'user@example.com';
      const password = '1234';

      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(email, password);
      expect(result).toBeNull();
    });

    it('이메일로 유저를 찾고 비밀번호가 일치하면 사용자를 반환', async () => {
      const email = 'user@example.com';
      const password = '1234';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { email: email, password: hashedPassword };

      mockAuthRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.validateUser(email, password);
      expect(result).toEqual(user);
    });
  });
});
