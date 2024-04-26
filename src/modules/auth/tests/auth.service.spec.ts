import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from '@nestjs-modules/ioredis';
import * as bcrypt from 'bcrypt';

// const mockRedis = {
//   get: jest.fn(),
//   set: jest.fn(),
//   del: jest.fn(),
// };

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockAuthRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    mockRedis.get.mockClear();
    mockRedis.set.mockClear();
    mockRedis.del.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RedisModule.forRootAsync({
          useFactory: () => ({
            type: 'single',
            nodes: [
              {
                host: 'mock',
                port: 0,
              },
            ],
          }),
        }),
      ],
      providers: [AuthService, { provide: AuthRepository, useValue: mockAuthRepository }],
    })
      .overrideProvider(RedisModule)
      .useValue(mockRedis)
      .compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('이메일로 유저를 찾을 수 없으면 null 반환', async () => {
      const email = 'user1@example.com';
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
});
