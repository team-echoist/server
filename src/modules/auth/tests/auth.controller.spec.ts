import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UtilsService } from '../../utils/utils.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CheckEmailReqDto } from '../dto/request/checkEmailReq.dto';
import { CheckNicknameReqDto } from '../dto/request/checkNicknameReq.dto';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { EmailReqDto } from '../dto/request/emailReq.dto';
import { PasswordResetReqDto } from '../dto/request/passwordResetReq.dto';
import { OauthMobileReqDto } from '../dto/request/OauthMobileReq.dto';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { User } from '../../../entities/user.entity';

jest.mock('../auth.service');
jest.mock('../../utils/utils.service');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let utilsService: jest.Mocked<UtilsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [AuthController],
      providers: [
        AuthService,
        UtilsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(() => of({ data: { kakao_account: { email: 'test@test.com' } } })),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AuthGuard('local'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AuthGuard('google'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService) as jest.Mocked<AuthService>;
    utilsService = module.get<UtilsService>(UtilsService) as jest.Mocked<UtilsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkEmail', () => {
    it('should call service checkEmail method', async () => {
      const dto: CheckEmailReqDto = { email: 'test@example.com' };
      authService.checkEmail.mockResolvedValue(true);

      const result = await controller.checkEmail(dto);
      expect(authService.checkEmail).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(true);
    });
  });

  describe('checkNick', () => {
    it('should call service checkNickname method', async () => {
      const dto: CheckNicknameReqDto = { nickname: 'nickname' };
      authService.checkNickname.mockResolvedValue();

      await controller.checkNick(dto);
      expect(authService.checkNickname).toHaveBeenCalledWith(dto.nickname);
    });
  });

  describe('verifyEmail', () => {
    it('should call service verifEmail method', async () => {
      const dto: EmailReqDto = { email: 'test@example.com' };
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.verifyEmail(req, dto);
      expect(authService.verifyEmail).toHaveBeenCalledWith(req.user.id, dto.email);
    });
  });

  describe('updateEmail', () => {
    it('should call service updateEmail method', async () => {
      const token = 'testToken';
      const req: ExpressRequest = {
        user: { id: 1 },
        device: { os: 'any', type: 'any', model: 'any' },
      } as any;
      const res: Response = { redirect: jest.fn() } as any;

      await controller.updateEmail(req, res, token);
      expect(authService.updateEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('verify', () => {
    it('should call service signingUp method', async () => {
      const dto: CreateUserReqDto = {
        email: 'test@example.com',
        password: 'password',
        nickname: 'nickname',
      };

      await controller.sign(dto);
      expect(authService.signingUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('register', () => {
    it('should call service register method and utils generateJWT', async () => {
      const token = 'testToken';
      const req: ExpressRequest = { device: 'iPhone' } as any;
      const res: Response = { redirect: jest.fn() } as any;
      const user = { id: 1, email: 'test@example.com' };
      const jwt = 'newJwt';

      authService.register.mockResolvedValue(user as any);

      await controller.register(token, req, res);

      expect(authService.register).toHaveBeenCalledWith(token);
      // expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(jwt));
    });
  });

  describe('login', () => {
    it('should return undefined', async () => {
      const req: ExpressRequest = {} as any;
      const result = await controller.login(req);
      expect(result).toBeUndefined();
    });
  });

  describe('passwordResetReq', () => {
    it('should call service passwordResetReq method', async () => {
      const dto: EmailReqDto = { email: 'test@example.com' };

      await controller.passwordResetReq(dto);
      expect(authService.passwordResetReq).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('passwordResetVerify', () => {
    it('should call service passwordResetVerify method', async () => {
      const token = 'testToken';
      const req: ExpressRequest = { device: 'iPhone' } as any;
      const res: Response = { redirect: jest.fn() } as any;
      const newToken = 'newToken';

      authService.passwordResetVerify.mockResolvedValue(newToken);

      await controller.passwordResetVerify(token, req, res);

      expect(authService.passwordResetVerify).toHaveBeenCalledWith(token);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(newToken));
    });
  });

  describe('passwordReset', () => {
    it('should call service passwordReset method', async () => {
      const dto: PasswordResetReqDto = { token: 'testToken', password: 'newPassword' };

      await controller.passwordReset(dto);
      expect(authService.passwordReset).toHaveBeenCalledWith(dto);
    });
  });

  describe('google', () => {
    it('should return undefined', async () => {
      const result = await controller.google();
      expect(result).toBeUndefined();
    });
  });

  describe('googleCallback', () => {
    it('should call service oauthLogin method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const res: Response = { redirect: jest.fn() } as any;
      const user = { id: 1 };

      authService.oauthLogin.mockResolvedValue(user as any);

      await controller.googleCallback(req, res);
      expect(authService.oauthLogin).toHaveBeenCalledWith(req.user);
    });
  });

  describe('androidGoogleLogin', () => {
    it('should call service validateGoogleUser method', async () => {
      const dto: OauthMobileReqDto = { token: 'googleToken' };
      const req: ExpressRequest = {} as any;
      const user = { id: 1, email: 'test@example.com' } as User;

      authService.validateGoogleUser.mockResolvedValue(user);

      const result = await controller.mobileGoogleLogin(req, dto);
      expect(authService.validateGoogleUser).toHaveBeenCalledWith(dto.token);
      // expect(result).toEqual(undefined);
    });
  });
});
