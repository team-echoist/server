import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../../common/guards/jwtAuth.guard';
import { CheckEmailReqDto } from '../dto/request/checkEmailReq.dto';
import { CheckNicknameReqDto } from '../dto/request/checkNicknameReq.dto';
import { EmailReqDto } from '../dto/request/emailReq.dto';
import { VerifyCodeReqDto } from '../dto/request/verifyCodeReq.dto';
import { CreateUserReqDto } from '../dto/request/createUserReq.dto';
import { OauthMobileReqDto } from '../dto/request/OauthMobileReq.dto';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            checkEmail: jest.fn(),
            checkNickname: jest.fn(),
            verifyEmail: jest.fn(),
            updateEmail: jest.fn(),
            signingUp: jest.fn(),
            register: jest.fn(),
            login: jest.fn(),
            passwordReset: jest.fn(),
            validateGoogleUser: jest.fn(),
            validateKakaoUser: jest.fn(),
            validateNaverUser: jest.fn(),
            validateAppleUser: jest.fn(),
            oauthLogin: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('이메일 중복 체크', async () => {
    const mockEmail = 'test@example.com';
    const reqDto: CheckEmailReqDto = { email: mockEmail };
    jest.spyOn(authService, 'checkEmail').mockResolvedValue(true);

    const result = await controller.checkEmail(reqDto);

    expect(result).toBe(true);
    expect(authService.checkEmail).toHaveBeenCalledWith(mockEmail);
  });

  it('닉네임 중복 체크', async () => {
    const mockNickname = 'testNickname';
    const reqDto: CheckNicknameReqDto = { nickname: mockNickname };
    jest.spyOn(authService, 'checkNickname').mockResolvedValue(true as any);

    const result = await controller.checkNick(reqDto);

    expect(result).toBe(true);
    expect(authService.checkNickname).toHaveBeenCalledWith(mockNickname);
  });

  it('이메일 인증 요청', async () => {
    const mockEmail = 'test@example.com';
    const reqDto: EmailReqDto = { email: mockEmail };
    const mockReq = { user: { id: 1 } } as Request;
    jest.spyOn(authService, 'verifyEmail').mockResolvedValue(undefined);

    await controller.verifyEmail(mockReq, reqDto);

    expect(authService.verifyEmail).toHaveBeenCalledWith(mockReq, mockEmail);
  });

  it('이메일 변경을 처리', async () => {
    const mockCode = '123456';
    const reqDto: VerifyCodeReqDto = { code: mockCode };
    const mockReq = { user: { id: 1 } } as Request;
    jest.spyOn(authService, 'updateEmail').mockResolvedValue(undefined);

    await controller.updateEmail(mockReq, reqDto);

    expect(authService.updateEmail).toHaveBeenCalledWith(mockReq, mockCode);
  });

  it('회원가입 인증 요청', async () => {
    const mockUserDto: CreateUserReqDto = { email: 'test@example.com', password: 'password123' };
    const mockReq = { user: { id: 1 } } as Request;
    jest.spyOn(authService, 'signingUp').mockResolvedValue(undefined);

    await controller.sign(mockReq, mockUserDto);

    expect(authService.signingUp).toHaveBeenCalledWith(mockReq, mockUserDto);
  });

  it('회원등록', async () => {
    const mockCode = '123456';
    const reqDto: VerifyCodeReqDto = { code: mockCode };
    const mockReq = { user: { id: 1 } } as Request;
    jest
      .spyOn(authService, 'register')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.register(mockReq, reqDto);

    expect(authService.register).toHaveBeenCalledWith(mockReq, mockCode);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('로그인', async () => {
    const mockReq = { user: { id: 1 } } as Request;
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.login(mockReq);

    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('비밀번호 재설정', async () => {
    const mockEmail = 'test@example.com';
    const reqDto: EmailReqDto = { email: mockEmail };
    jest.spyOn(authService, 'passwordReset').mockResolvedValue(undefined);

    await controller.passwordReset(reqDto);

    expect(authService.passwordReset).toHaveBeenCalledWith(mockEmail);
  });

  it('구글 OAuth 콜백', async () => {
    const mockReq = { user: { id: 1 } } as Request as any;
    const mockRes = { redirect: jest.fn() } as unknown as Response;
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    jest.spyOn(configService, 'get').mockReturnValue('http://localhost:3000');

    await controller.googleCallback(mockReq, mockRes);

    expect(authService.oauthLogin).toHaveBeenCalledWith(mockReq.user);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(mockRes.redirect).toHaveBeenCalledWith(
      'http://localhost:3000?accessToken=access-token&refreshToken=refresh-token',
    );
  });

  it('구글 모바일 OAuth 로그인', async () => {
    const mockToken = 'google-token';
    const reqDto: OauthMobileReqDto = { token: mockToken };
    const mockReq = { user: { id: 1 } } as Request as any;
    jest.spyOn(authService, 'validateGoogleUser').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.mobileGoogleLogin(mockReq, reqDto);

    expect(authService.validateGoogleUser).toHaveBeenCalledWith(mockToken);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('카카오 OAuth 콜백', async () => {
    const mockReq = { user: { id: 1 } } as Request as any;
    const mockRes = { redirect: jest.fn() } as unknown as Response;
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    jest.spyOn(configService, 'get').mockReturnValue('http://localhost:3000');

    await controller.kakaoCallback(mockReq, mockRes);

    expect(authService.oauthLogin).toHaveBeenCalledWith(mockReq.user);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(mockRes.redirect).toHaveBeenCalledWith(
      'http://localhost:3000?accessToken=access-token&refreshToken=refresh-token',
    );
  });

  it('카카오 모바일 OAuth 로그인', async () => {
    const mockToken = 'kakao-token';
    const reqDto: OauthMobileReqDto = { token: mockToken };
    const mockReq = { user: { id: 1 } } as Request as any;
    jest.spyOn(authService, 'validateKakaoUser').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.mobileKakaoLogin(mockReq, reqDto);

    expect(authService.validateKakaoUser).toHaveBeenCalledWith(mockToken);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('네이버 OAuth 콜백', async () => {
    const mockReq = { user: { id: 1 } } as Request as any;
    const mockRes = { redirect: jest.fn() } as unknown as Response;
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    jest.spyOn(configService, 'get').mockReturnValue('http://localhost:3000');

    await controller.naverCallback(mockReq, mockRes);

    expect(authService.oauthLogin).toHaveBeenCalledWith(mockReq.user);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(mockRes.redirect).toHaveBeenCalledWith(
      'http://localhost:3000?accessToken=access-token&refreshToken=refresh-token',
    );
  });

  it('네이버 모바일 OAuth 로그인', async () => {
    const mockToken = 'naver-token';
    const reqDto: OauthMobileReqDto = { token: mockToken };
    const mockReq = { user: { id: 1 } } as Request as any;
    jest.spyOn(authService, 'validateNaverUser').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.mobileNaverLogin(mockReq, reqDto);

    expect(authService.validateNaverUser).toHaveBeenCalledWith(mockToken);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('애플 OAuth 콜백', async () => {
    const mockReq = { user: { id: 1 } } as Request as any;
    const mockRes = { redirect: jest.fn() } as unknown as Response;
    jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    jest.spyOn(configService, 'get').mockReturnValue('http://localhost:3000');

    await controller.appleCallback(mockReq, mockRes);

    expect(authService.oauthLogin).toHaveBeenCalledWith(mockReq.user);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(mockRes.redirect).toHaveBeenCalledWith(
      'http://localhost:3000?accessToken=access-token&refreshToken=refresh-token',
    );
  });

  it('애플 모바일 OAuth 로그인을 처리해야 한다', async () => {
    const mockToken = 'apple-token';
    const reqDto: OauthMobileReqDto = { token: mockToken };
    const mockReq = { user: { id: 1 } } as Request as any;
    jest.spyOn(authService, 'validateAppleUser').mockResolvedValue(mockReq.user);
    jest
      .spyOn(authService, 'login')
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await controller.mobileAppleLogin(mockReq, reqDto);

    expect(authService.validateAppleUser).toHaveBeenCalledWith(mockToken);
    expect(authService.login).toHaveBeenCalledWith(mockReq);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});
