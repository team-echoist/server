import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { CreateUserReqDto } from '../dto/createUserReq.dto';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      // 비동기 함수는 항상 promise를 반환해야합니다.
      register: jest.fn(),
      generateJWT: jest.fn((user) => `token-${user.id}`),
      oauthLogin: jest.fn((user) => Promise.resolve(`token-${user.id}`)),
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

  it('/register should create a new user and return a JWT', async () => {
    // Partial = 해당 객체의 모든 메소드와 속성을 옵셔널로 만들어주는 타입.
    const mockResponse: Partial<Response> = {
      setHeader: jest.fn(),
      // res.status().send() 형식에서 send로 상태를 체이닝 하기 위한 jset 함수
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const createUserDto = new CreateUserReqDto();
    createUserDto.email = 'test@example.com';
    createUserDto.password = 'password';

    mockAuthService.register = jest.fn((dto) =>
      Promise.resolve({
        id: 1,
        email: dto.email,
        password: dto.password,
        birthDate: null,
        gender: null,
        oauthInfo: {},
      }),
    );

    // 컨트롤러의 register를 호출 했을 때 아래의 service메서드와 res메서드들이 호출되었는지 (독립 단위 테스트라 반환값은 필요 없음)
    await controller.register(createUserDto, mockResponse as Response);

    // mockAuthService 의 register 함수가 createUserDto를 인수로 호출되었는지 확인. 이하 비슷비슷
    expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    expect(mockAuthService.generateJWT).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Authorization', expect.any(String)); // 임의의 문자열
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(mockResponse.send).toHaveBeenCalled();
  });
});
