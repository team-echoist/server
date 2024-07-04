import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from '../follow.controller';
import { FollowService } from '../follow.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

jest.mock('../follow.service');

describe('FollowController', () => {
  let controller: FollowController;
  let service: jest.Mocked<FollowService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [FollowController],
      providers: [FollowService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<FollowController>(FollowController);
    service = module.get<FollowService>(FollowService) as jest.Mocked<FollowService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFollowings', () => {
    it('should call service getFollowings method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 20;
      const followings = { items: [], total: 0 };

      service.getFollowings.mockResolvedValue(followings as any);

      const response = await controller.getFollowings(req, page, limit);
      expect(service.getFollowings).toHaveBeenCalledWith(req.user.id, page, limit);
      expect(response).toEqual(followings);
    });
  });

  describe('follow', () => {
    it('should call service follow method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const userId = 2;

      await controller.follow(req, userId);
      expect(service.follow).toHaveBeenCalledWith(req.user.id, userId);
    });
  });

  describe('unFollow', () => {
    it('should call service unFollow method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const userId = 2;

      await controller.upFollow(req, userId);
      expect(service.unFollow).toHaveBeenCalledWith(req.user.id, userId);
    });
  });
});
