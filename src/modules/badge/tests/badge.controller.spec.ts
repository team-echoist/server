import { Test, TestingModule } from '@nestjs/testing';
import { BadgeController } from '../badge.controller';
import { BadgeService } from '../badge.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

jest.mock('../badge.service');

describe('BadgeController', () => {
  let controller: BadgeController;
  let service: jest.Mocked<BadgeService>;

  jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [BadgeController],
      providers: [BadgeService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<BadgeController>(BadgeController);
    service = module.get<BadgeService>(BadgeService) as jest.Mocked<BadgeService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('levelUpBadge', () => {
    it('should call service levelUpBadge method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const badgeId = 1;

      await controller.levelUpBadge(req, badgeId);
      expect(service.levelUpBadge).toHaveBeenCalledWith(req.user.id, badgeId);
    });
  });

  describe('userBadges', () => {
    it('should call service getBadges method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.userBadges(req);
      expect(service.getBadges).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('userBadgesWithTags', () => {
    it('should call service getBadgeWithTags method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.userBadgesWithTags(req);
      expect(service.getBadgeWithTags).toHaveBeenCalledWith(req.user.id);
    });
  });
});
