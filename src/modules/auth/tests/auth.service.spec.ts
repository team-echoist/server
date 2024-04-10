import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { CreateUserReqDto } from '../dto/createUserReq.dto';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('fake_hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../../../common/utils/jwt.utils', () => ({
  generateJWT: jest.fn().mockReturnValue('mockToken'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: Partial<AuthRepository>;

  beforeEach(async () => {
    mockAuthRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    authService = new AuthService(mockAuthRepository as AuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw HttpException if email already exists', async () => {
      const createUserDto: CreateUserReqDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthRepository.findByEmail = jest.fn().mockResolvedValue(createUserDto);

      await expect(authService.register(createUserDto)).rejects.toThrow(HttpException);
    });

    it('should successfully register a new user', async () => {
      const createUserDto: CreateUserReqDto = {
        email: 'newuser@example.com',
        password: 'newpassword',
      };
      createUserDto.password = await bcrypt.hash('newpassword', 10);

      const savedUser = {
        id: 1,
        email: 'newuser@example.com',
      };

      mockAuthRepository.findByEmail = jest.fn().mockResolvedValue(null);
      mockAuthRepository.createUser = jest.fn().mockResolvedValue(savedUser);

      const result = await authService.register(createUserDto);

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(savedUser);
    });
  });

  describe('validateUser', () => {
    it('should validate and return the user if password matches', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const email = 'valid@example.com';
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { email, password: hashedPassword };

      mockAuthRepository.findByEmail = jest.fn().mockResolvedValue(user);

      const result = await authService.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(user);
    });

    it('should return null if password does not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(null);
      const email = 'invalid@example.com';
      const password = 'wrongpassword';
      const user = { email, password: 'correcthashedpassword' };

      mockAuthRepository.findByEmail = jest.fn().mockResolvedValue(user);

      const result = await authService.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toBeNull();
    });
  });
});
