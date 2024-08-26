import { Test, TestingModule } from '@nestjs/testing';
import { EssayController } from '../essay.controller';
import { EssayService } from '../essay.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { UpdateEssayReqDto } from '../dto/request/updateEssayReq.dto';
import { PageType } from '../../../common/types/enum.types';

jest.mock('../essay.service');

describe('EssayController', () => {
  let controller: EssayController;
  let service: jest.Mocked<EssayService>;

  jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [EssayController],
      providers: [EssayService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<EssayController>(EssayController);
    service = module.get<EssayService>(EssayService) as jest.Mocked<EssayService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('saveEssay', () => {
    it('should call service saveEssay method', async () => {
      const req: ExpressRequest = { user: { id: 1 }, device: 'device' } as any;
      const dto: CreateEssayReqDto = { title: 'title', content: 'content', tags: [] };
      const result = { id: 1, title: 'new title' };

      service.saveEssay.mockResolvedValue(result as any);

      const response = await controller.saveEssay(req, dto);
      expect(service.saveEssay).toHaveBeenCalledWith(req.user, req.device, dto);
      expect(response).toEqual(result);
    });
  });

  describe('updateEssay', () => {
    it('should call service updateEssay method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;
      const dto: UpdateEssayReqDto = { title: 'new title', content: 'new content', tags: [] };
      const result = { id: 1, title: 'new title' };

      service.updateEssay.mockResolvedValue(result as any);

      const response = await controller.updateEssay(req, essayId, dto);
      expect(service.updateEssay).toHaveBeenCalledWith(req.user, essayId, dto);
      expect(response).toEqual(result);
    });
  });

  describe('getMyEssay', () => {
    it('should call service getMyEssays method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 10;
      const storyId = 1;
      const result = { items: [], total: 0 };

      service.getMyEssays.mockResolvedValue(result as any);

      const response = await controller.getMyEssay(req, page, limit, PageType.PUBLIC, storyId);
      expect(service.getMyEssays).toHaveBeenCalledWith(
        req.user.id,
        PageType.PUBLIC,
        storyId,
        page,
        limit,
      );
      expect(response).toEqual(result);
    });
  });

  describe('getTargetUserEssays', () => {
    it('should call service getTargetUserEssays method', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const storyId = 1;
      const result = { items: [], total: 0 };

      service.getTargetUserEssays.mockResolvedValue(result as any);

      const response = await controller.getTargetUserEssays(userId, page, limit, storyId);
      expect(service.getTargetUserEssays).toHaveBeenCalledWith(userId, storyId, page, limit);
      expect(response).toEqual(result);
    });
  });

  describe('saveThumbnail', () => {
    it('should call service saveThumbnail method', async () => {
      const file: Express.Multer.File = {} as any;
      const essayId = 1;
      const result = { url: 'thumbnail_url' };

      service.saveThumbnail.mockResolvedValue(result as any);

      const response = await controller.saveThumbnail(file, essayId);
      expect(service.saveThumbnail).toHaveBeenCalledWith(file, essayId);
      expect(response).toEqual(result);
    });
  });

  describe('deleteThumbnail', () => {
    it('should call service deleteThumbnail method', async () => {
      const essayId = 1;

      await controller.deleteThumbnail(essayId);
      expect(service.deleteThumbnail).toHaveBeenCalledWith(essayId);
    });
  });

  describe('getRecommendEssays', () => {
    it('should call service getRecommendEssays method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const limit = 10;
      const result = { items: [], total: 0 };

      service.getRecommendEssays.mockResolvedValue(result as any);

      const response = await controller.getRecommendEssays(req, limit);
      expect(service.getRecommendEssays).toHaveBeenCalledWith(req.user.id, limit);
      expect(response).toEqual(result);
    });
  });

  describe('getFollowingsEssays', () => {
    it('should call service getFollowingsEssays method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 10;
      const result = { items: [], total: 0 };

      service.getFollowingsEssays.mockResolvedValue(result as any);

      const response = await controller.getFollowingsEssays(req, page, limit);
      expect(service.getFollowingsEssays).toHaveBeenCalledWith(req.user.id, page, limit);
      expect(response).toEqual(result);
    });
  });

  describe('oneSentenceEssays', () => {
    it('should call service getSentenceEssays method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const type = 'first';
      const limit = 6;
      const result = { items: [], total: 0 };

      service.getSentenceEssays.mockResolvedValue(result as any);

      const response = await controller.oneSentenceEssays(req, type, limit);
      expect(service.getSentenceEssays).toHaveBeenCalledWith(req.user.id, type, limit);
      expect(response).toEqual(result);
    });
  });

  describe('getRecentViewedEssays', () => {
    it('should call service getRecentViewedEssays method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 10;
      const result = { items: [], total: 0 };

      service.getRecentViewedEssays.mockResolvedValue(result as any);

      const response = await controller.getRecentViewedEssays(req, page, limit);
      expect(service.getRecentViewedEssays).toHaveBeenCalledWith(req.user.id, page, limit);
      expect(response).toEqual(result);
    });
  });

  describe('searchEssays', () => {
    it('should call service searchEssays method', async () => {
      const keyword = 'test';
      const page = 1;
      const limit = 10;
      const result = { items: [], total: 0 };

      service.searchEssays.mockResolvedValue(result);

      const response = await controller.searchEssays(keyword, page, limit);
      expect(service.searchEssays).toHaveBeenCalledWith(keyword, page, limit);
      expect(response).toEqual(result);
    });
  });

  describe('getEssay', () => {
    it('should call service getEssay method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;
      const result = { id: 1, title: 'title' };

      service.getEssay.mockResolvedValue(result as any);

      const response = await controller.getEssay(req, essayId, PageType.RECOMMEND);
      expect(service.getEssay).toHaveBeenCalledWith(req.user.id, essayId, 'recommend');
      expect(response).toEqual(result);
    });
  });

  describe('deleteEssay', () => {
    it('should call service deleteEssay method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;

      await controller.deleteEssay(req, essayId);
      expect(service.deleteEssay).toHaveBeenCalledWith(req.user.id, essayId);
    });
  });
});
