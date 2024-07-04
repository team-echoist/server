import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';

jest.mock('../user.service');

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService) as jest.Mocked<UserService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestDeactivation', () => {
    it('should call service requestDeactivation method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const data = { reasons: 'Reason for deactivation' };

      await controller.requestDeactivation(req, data as any);
      expect(service.requestDeactivation).toHaveBeenCalledWith(req.user.id, data);
    });
  });

  describe('cancelDeactivation', () => {
    it('should call service cancelDeactivation method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.cancelDeactivation(req);
      expect(service.cancelDeactivation).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('deleteAccount', () => {
    it('should call service deleteAccount method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.deleteAccount(req);
      expect(service.deleteAccount).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('saveProfileImage', () => {
    it('should call service saveProfileImage method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const file: Express.Multer.File = { originalname: 'image.png' } as any;

      await controller.saveProfileImage(req, file);
      expect(service.saveProfileImage).toHaveBeenCalledWith(req.user.id, file);
    });
  });

  describe('deleteProfileImage', () => {
    it('should call service deleteProfileImage method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.deleteProfileImage(req);
      expect(service.deleteProfileImage).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('updateUser', () => {
    it('should call service updateUser method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const data: UpdateUserReqDto = { email: 'new@example.com', nickname: 'newnickname' };

      await controller.updateUser(req, data);
      expect(service.updateUser).toHaveBeenCalledWith(req.user.id, data);
    });
  });

  describe('userSummary', () => {
    it('should call service getUserSummary method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const summary = {
        user: { id: 1, nickname: 'user' },
        weeklyEssayCounts: [],
      };

      service.getUserSummary.mockResolvedValue(summary as any);

      const response = await controller.userSummary(req);
      expect(service.getUserSummary).toHaveBeenCalledWith(req.user.id);
      expect(response).toEqual(summary);
    });
  });

  describe('getUserInfo', () => {
    it('should call service getUserInfo method', async () => {
      const userId = 1;
      const userInfo = {
        user: { id: 1, nickname: 'user' },
        essayStats: {},
      };

      service.getUserInfo.mockResolvedValue(userInfo as any);

      const response = await controller.getUserInfo(userId);
      expect(service.getUserInfo).toHaveBeenCalledWith(userId);
      expect(response).toEqual(userInfo);
    });
  });
});
