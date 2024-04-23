import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RedisCacheService } from '../../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockCacheManager: any;
  let mockAuthRepository: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };
    mockAuthRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RedisCacheService, useValue: mockCacheManager },
        { provide: AuthRepository, useValue: mockAuthRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('사용자를 찾을 수 없으면 null을 반환', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      expect(await service.validateUser('user@example.com', 'password123')).toBeNull();
    });

    it('이메일과 비밀번호가 일치하면 사용자를 반환', async () => {
      const user = { email: 'user@example.com', password: await bcrypt.hash('password123', 10) };
      mockCacheManager.get.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(user);

      expect(await service.validateUser('user@example.com', 'password123')).toEqual(user);
    });
  });

  describe('checkEmail', () => {
    it('이미 사용중인 이메일이라면 예외처리.', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com' });

      await expect(service.checkEmail({ email: 'user@example.com' })).rejects.toThrow(
        HttpException,
      );
    });

    it('중복되지 않아서 사용할 수 있는 이메일이라면 true를 반환', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      expect(await service.checkEmail({ email: 'new@example.com' })).toBe(true);
    });
  });

  describe('register', () => {
    it('이미 사용중인 이메일이라면 예외처리', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({ email: 'user@example.com' });

      await expect(
        service.register({ email: 'user@example.com', password: 'password123' }),
      ).rejects.toThrow(HttpException);
    });

    it('회원등록 성공시 응답 DTO 반환', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 1,
        email: 'new@example.com',
        password: 'hashed',
      });

      const result = await service.register({ email: 'new@example.com', password: 'password123' });
      expect(result).toEqual({ id: 1, email: 'new@example.com', password: 'hashed' });
    });
  });
});
