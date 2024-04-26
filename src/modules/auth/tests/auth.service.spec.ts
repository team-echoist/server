import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CheckEmailReqDto } from '../dto/checkEamilReq.dto';
import { CreateUserReqDto } from '../dto/createUserReq.dto';
import { User } from '../../../entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockAuthRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    const RedisInstance = jest.fn(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('이메일로 유저를 찾을 수 없으면 null 반환', async () => {
      const email = 'user@example.com';
      const password = '1234';

      mockRedis.get.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(email, password);
      expect(result).toBeNull();
    });

    it('데이터가 발견되고 비밀번호가 일치하면 사용자를 반환', async () => {
      const email = 'user@example.com';
      const password = '1234';
      const hashedPassword = await bcrypt.hash('1234', 10);
      const user = { email, password: hashedPassword };

      mockAuthRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.validateUser(email, password);
      expect(result).toEqual(user);
    });
  });

  describe('checkEmail', () => {
    it('캐시에 이메일이 있다면 예외처리', async () => {
      const checkEmailReqDto = new CheckEmailReqDto();
      checkEmailReqDto.email = 'user@example.com';
      const cachedUser = 'user';

      mockRedis.get.mockResolvedValue(cachedUser);

      await expect(authService.checkEmail(checkEmailReqDto)).rejects.toThrow(HttpException);
    });

    it('데이터베이스에 이메일이 있다면 예외처리', async () => {
      const checkEmailReqDto = new CheckEmailReqDto();
      checkEmailReqDto.email = 'user@example.com';
      const user = new User();

      mockRedis.get.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.checkEmail(checkEmailReqDto)).rejects.toThrow(HttpException);
    });

    it('캐시와 데이터베이스에 중복된 이메일이 없다면 캐싱 후 true 응답', async () => {
      const checkEmailReqDto = new CheckEmailReqDto();
      checkEmailReqDto.email = 'user@example.com';

      mockRedis.get.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.checkEmail(checkEmailReqDto);

      expect(result).toEqual(true);
    });
  });

  describe('register', () => {
    it('회원가입 진행 전 이메일 중복 재검증 후 중복 시 예외처리', async () => {
      const registerData = new CreateUserReqDto();
      registerData.email = 'user@example.com';
      const user = new User();

      mockAuthRepository.findByEmail.mockResolvedValue(user);

      await expect(authService.register(registerData)).rejects.toThrow(HttpException);
    });
  });
});
