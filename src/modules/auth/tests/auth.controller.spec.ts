import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { CreateUserReqDto } from '../dto/createUserReq.dto';
import * as dotenv from 'dotenv';
dotenv.config();

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn().mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          email: dto.email,
          password: 'encryptedPassword',
        }),
      ),
      oauthLogin: jest.fn(),
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
    const createUserDto = new CreateUserReqDto();
    createUserDto.email = 'test@example.com';
    const mockRequest = {
      user: null,
    };

    const result = await controller.register(createUserDto, mockRequest as any);

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        email: 'test@example.com',
      }),
    );
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user).toEqual(expect.objectContaining({ email: 'test@example.com' }));
    expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
  });
});
