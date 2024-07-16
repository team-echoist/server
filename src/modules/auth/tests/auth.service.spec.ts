import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { UtilsService } from '../../utils/utils.service';
import { MailService } from '../../mail/mail.service';
import { NicknameService } from '../../nickname/nickname.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('bull');
jest.mock('../auth.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../mail/mail.service');
jest.mock('../../nickname/nickname.service');
jest.mock('@nestjs/config');
jest.mock('@nestjs/axios');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let mailService: jest.Mocked<MailService>;
  let nicknameService: jest.Mocked<NicknameService>;
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => mockRedis);
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpService],
      providers: [
        AuthService,
        AuthRepository,
        UtilsService,
        MailService,
        NicknameService,
        ConfigService,
        HttpService,
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    utilsService = module.get(UtilsService);
    mailService = module.get(MailService);
    nicknameService = module.get(NicknameService);
  });

  describe('checkEmail', () => {
    it('should throw an error if email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({ id: 1 } as any);
      await expect(authService.checkEmail('test@example.com')).rejects.toThrow(
        new HttpException('Email already exists', HttpStatus.CONFLICT),
      );
    });

    it('should return true if email does not exist', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.checkEmail('test@example.com')).resolves.toBe(true);
    });
  });

  describe('checkNickname', () => {
    it('should throw an error if nickname already exists', async () => {
      authRepository.findByNickname.mockResolvedValue({ id: 1 } as any);
      await expect(authService.checkNickname('nickname')).rejects.toThrow(
        new HttpException('Nickname already exists', HttpStatus.CONFLICT),
      );
    });

    it('should return if nickname does not exist', async () => {
      authRepository.findByNickname.mockResolvedValue(null);
      await expect(authService.checkNickname('nickname')).resolves.toBeUndefined();
    });
  });

  describe('isEmailOwned', () => {
    it('should throw an error if email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({ id: 1 } as any);
      await expect(authService.isEmailOwned('test@example.com')).rejects.toThrow(
        new HttpException('Email or nickname is already exists.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should return if email does not exist', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.isEmailOwned('test@example.com')).resolves.toBeUndefined();
    });
  });

  describe('signingUp', () => {
    it('should create a new user and send verification email', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      } as any;

      jest.spyOn(authService, 'isEmailOwned').mockResolvedValue();
      utilsService.generateVerifyToken.mockResolvedValue('token123');
      mailService.sendVerificationEmail.mockResolvedValue();

      await authService.signingUp(data);

      expect(authService.isEmailOwned).toHaveBeenCalledWith(data.email);
      expect(utilsService.generateVerifyToken).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(data.email, 'token123');
    });
  });

  describe('verifEmail', () => {
    it('should generate a verification token and send an email', async () => {
      const email = 'test@example.com';
      const userId = 1;

      jest.spyOn(authService, 'isEmailOwned').mockResolvedValue();
      utilsService.generateVerifyToken.mockResolvedValue('token123');
      mockRedis.set = jest.fn().mockResolvedValue('OK');
      mailService.updateEmail.mockResolvedValue();

      await authService.verifEmail(userId, email);

      expect(authService.isEmailOwned).toHaveBeenCalledWith(email);
      expect(utilsService.generateVerifyToken).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'token123',
        JSON.stringify({ email, userId }),
        'EX',
        600,
      );
      expect(mailService.updateEmail).toHaveBeenCalledWith(email, 'token123');
    });
  });

  describe('updateEmail', () => {
    it('should update the user email', async () => {
      const token = 'token123';
      const user = { id: 1, email: 'old@example.com' };
      const userEmailData = { email: 'new@example.com', userId: 1 };

      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(userEmailData));
      authRepository.findById.mockResolvedValue(user as any);
      authRepository.saveUser.mockResolvedValue(user as any);
      mockRedis.set = jest.fn().mockResolvedValue('OK');

      await authService.updateEmail(token);

      expect(mockRedis.get).toHaveBeenCalledWith(token);
      expect(authRepository.findById).toHaveBeenCalledWith(userEmailData.userId);
      expect(authRepository.saveUser).toHaveBeenCalledWith({
        ...user,
        email: userEmailData.email,
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        `validate_${user.id}`,
        JSON.stringify(user),
        'EX',
        600,
      );
    });

    it('should throw an error if token is invalid or expired', async () => {
      const token = 'invalid_token';
      mockRedis.get = jest.fn().mockResolvedValue(null);

      await expect(authService.updateEmail(token)).rejects.toThrow(
        new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('register', () => {
    it('should save a new user and return it', async () => {
      const token = 'token123';
      const userData = { email: 'test@example.com', password: 'hashedPassword' };
      const nickname = 'uniqueNickname';

      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(userData));
      nicknameService.generateUniqueNickname.mockResolvedValue(nickname);
      authRepository.saveUser.mockResolvedValue({ ...userData, nickname } as any);

      const result = await authService.register(token);

      expect(mockRedis.get).toHaveBeenCalledWith(token);
      expect(nicknameService.generateUniqueNickname).toHaveBeenCalled();
      expect(authRepository.saveUser).toHaveBeenCalledWith({
        ...userData,
        nickname,
      });
      expect(result).toEqual({ ...userData, nickname });
    });

    it('should throw an error if token is not found', async () => {
      const token = 'invalid_token';
      mockRedis.get = jest.fn().mockResolvedValue(null);

      await expect(authService.register(token)).rejects.toThrow(
        new HttpException('Not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if email and password match', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: 1, email, password: hashedPassword, platformId: null, platform: null };

      authRepository.findByEmail.mockResolvedValue(user as any);
      const result = await authService.validateUser(email, password);

      expect(result).toEqual(user);
    });

    it('should return null if email or password do not match', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash('differentPassword', 10);
      const user = { id: 1, email, password: hashedPassword, platformId: null, platform: null };

      authRepository.findByEmail.mockResolvedValue(user as any);
      const result = await authService.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should throw an exception if user is a social subscriber', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: 1,
        email,
        password: hashedPassword,
        platformId: '123',
        platform: 'google',
      };

      authRepository.findByEmail.mockResolvedValue(user as any);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'This account is a social subscriber.',
      );
    });
  });

  describe('validatePayload', () => {
    it('should return user if cached user is found', async () => {
      const id = 1;
      const user = { id, email: 'test@example.com' };

      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(user));
      const result = await authService.validatePayload(id);

      expect(mockRedis.get).toHaveBeenCalledWith(`validate_${id}`);
      expect(result).toEqual(user);
    });

    it('should return user if cached user is not found but user exists in database', async () => {
      const id = 1;
      const user = { id, email: 'test@example.com' };

      mockRedis.get = jest.fn().mockResolvedValue(null);
      authRepository.findById.mockResolvedValue(user as any);
      mockRedis.set = jest.fn().mockResolvedValue('OK');

      const result = await authService.validatePayload(id);

      expect(authRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRedis.set).toHaveBeenCalledWith(`validate_${id}`, JSON.stringify(user), 'EX', 600);
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      const id = 1;

      mockRedis.get = jest.fn().mockResolvedValue(null);
      authRepository.findById.mockResolvedValue(null);

      const result = await authService.validatePayload(id);

      expect(result).toBeNull();
    });
  });

  describe('passwordResetReq', () => {
    it('should send password reset email if user exists', async () => {
      const email = 'test@example.com';
      const user = { id: 1, email };

      authRepository.findByEmail.mockResolvedValue(user as any);
      utilsService.generateVerifyToken.mockResolvedValue('token123');
      mockRedis.set = jest.fn().mockResolvedValue('OK');
      mailService.sendPasswordResetEmail.mockResolvedValue();

      await authService.passwordResetReq(email);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(utilsService.generateVerifyToken).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith('token123', JSON.stringify(user), 'EX', 600);
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(email, 'token123');
    });

    it('should throw an error if email is incorrect', async () => {
      const email = 'incorrect@example.com';

      authRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.passwordResetReq(email)).rejects.toThrow(
        new HttpException('This is an incorrect email.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('passwordResetVerify', () => {
    it('should return a new token if existing token is valid', async () => {
      const token = 'token123';
      const user = { id: 1, email: 'test@example.com' };

      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(user));
      utilsService.generateVerifyToken.mockResolvedValue('newToken123');
      mockRedis.set = jest.fn().mockResolvedValue('OK');

      const result = await authService.passwordResetVerify(token);

      expect(mockRedis.get).toHaveBeenCalledWith(token);
      expect(utilsService.generateVerifyToken).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith('newToken123', JSON.stringify(user), 'EX', 600);
      expect(result).toBe('newToken123');
    });

    it('should throw an error if token is not found', async () => {
      const token = 'invalid_token';

      mockRedis.get = jest.fn().mockResolvedValue(null);

      await expect(authService.passwordResetVerify(token)).rejects.toThrow(
        new HttpException('Not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('passwordReset', () => {
    it('should reset password if token is valid', async () => {
      const data = { token: 'token123', password: 'newPassword123' };
      const user = { id: 1, email: 'test@example.com', password: 'oldPassword' };

      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(user));
      authRepository.saveUser.mockResolvedValue(user as any);

      await authService.passwordReset(data);

      expect(mockRedis.get).toHaveBeenCalledWith(data.token);
      expect(authRepository.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ...user,
          password: expect.any(String),
        }),
      );
    });

    it('should throw an error if token is not found', async () => {
      const data = { token: 'invalid_token', password: 'newPassword123' };

      mockRedis.get = jest.fn().mockResolvedValue(null);

      await expect(authService.passwordReset(data)).rejects.toThrow(
        new HttpException('Not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('oauthLogin', () => {
    it('should create a new user if email does not exist', async () => {
      const oauthUser = { email: 'test@example.com', platform: 'google', platformId: '12345' };
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.saveUser.mockResolvedValue(oauthUser as any);

      const result = await authService.oauthLogin(oauthUser as any);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(oauthUser.email);
      expect(authRepository.saveUser).toHaveBeenCalledWith({
        email: oauthUser.email,
        platform: oauthUser.platform,
        platformId: oauthUser.platformId,
      });
      expect(result).toEqual(oauthUser);
    });
  });
});
