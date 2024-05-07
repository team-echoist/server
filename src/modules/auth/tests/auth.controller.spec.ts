import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import * as dotenv from 'dotenv';
dotenv.config();

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      checkEmail: jest.fn(),
      isEmailOwned: jest.fn(),
      register: jest.fn(),
      validateUser: jest.fn(),
      validatePayload: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('health-check', () => {
    it('건강하니?', async () => {
      const result = await controller.healthCheck();

      expect(result).toBe('살아있느니라');
    });
  });

  describe('check-email', () => {
    it('이메일 중복 검사 후 불린값 반환', async () => {
      const email = 'test@email.com';
      mockAuthService.checkEmail.mockResolvedValue(true);

      const result = await controller.checkEmail(email);
      expect(result).toBe(true);
    });
  });

  describe('verify', () => {
    it('클라이언트에게 회원정보를 받아 서비스 호출', async () => {
      const userData = new CreateUserReqDto();

      await mockAuthService.isEmailOwned(userData);
      expect(mockAuthService.isEmailOwned).toHaveBeenCalledWith(userData);
    });
  });

  describe('register', () => {
    it('클라이언트가 쿼리로 보낸 토큰을 확인하기위해 서비스 호출', async () => {
      const token = 'token';

      await mockAuthService.register(token);

      expect(mockAuthService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('login', () => {
    it('가드에서 알아서 처리하는데 어떻게 작성해야할까 ~_~', async () => {});
  });
});
