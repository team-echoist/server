import { Test, TestingModule } from '@nestjs/testing';
import { StoryController } from '../story.controller';
import { StoryService } from '../story.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { CreateStoryReqDto } from '../dto/repuest/createStoryReq.dto';
import { UpdateStoryReqDto } from '../dto/repuest/updateStoryReq.dto';

jest.mock('../story.service');

describe('StoryController', () => {
  let controller: StoryController;
  let service: jest.Mocked<StoryService>;

  jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [StoryController],
      providers: [StoryService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<StoryController>(StoryController);
    service = module.get<StoryService>(StoryService) as jest.Mocked<StoryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyStories', () => {
    it('should call service getStories method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const stories = { items: [], total: 0 };

      service.getStories.mockResolvedValue(stories as any);

      const response = await controller.getMyStories(req);
      expect(service.getStories).toHaveBeenCalledWith(req.user.id);
      expect(response).toEqual(stories);
    });
  });

  describe('saveStory', () => {
    it('should call service saveStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const data: CreateStoryReqDto = { name: 'My Story', essayIds: [1, 2, 3] };
      const story = { id: 1, name: 'My Story', essayIds: [1, 2, 3] };

      service.saveStory.mockResolvedValue(story as any);

      const response = await controller.saveStory(req, data);
      expect(service.saveStory).toHaveBeenCalledWith(req.user.id, data);
      expect(response).toEqual(story);
    });
  });

  describe('updateStory', () => {
    it('should call service updateStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const storyId = 1;
      const data: UpdateStoryReqDto = { name: 'Updated Story', essayIds: [1, 2, 3] };
      const story = { id: 1, name: 'Updated Story', essayIds: [1, 2, 3] };

      service.updateStory.mockResolvedValue(story as any);

      const response = await controller.updateStory(req, storyId, data);
      expect(service.updateStory).toHaveBeenCalledWith(req.user.id, storyId, data);
      expect(response).toEqual(story);
    });
  });

  describe('deleteStory', () => {
    it('should call service deleteStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const storyId = 1;

      await controller.deleteStory(req, storyId);
      expect(service.deleteStory).toHaveBeenCalledWith(req.user.id, storyId);
    });
  });

  describe('updateEssayStory', () => {
    it('should call service updateEssayStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const storyId = 1;
      const essayId = 2;

      await controller.updateEssayStory(req, essayId, storyId);
      expect(service.updateEssayStory).toHaveBeenCalledWith(req.user.id, essayId, storyId);
    });
  });

  describe('deleteEssayStory', () => {
    it('should call service deleteEssayStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;

      await controller.deleteEssayStory(req, essayId);
      expect(service.deleteEssayStory).toHaveBeenCalledWith(req.user.id, essayId);
    });
  });

  describe('getEssayToUpdateStory', () => {
    it('should call service getEssayToUpdateStory method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const storyId = 1;
      const page = 1;
      const limit = 20;
      const essays = { items: [], total: 0 };

      service.getEssayToUpdateStory.mockResolvedValue(essays as any);

      const response = await controller.getEssayToUpdateStory(req, storyId, page, limit);
      expect(service.getEssayToUpdateStory).toHaveBeenCalledWith(req.user.id, storyId, page, limit);
      expect(response).toEqual(essays);
    });
  });

  describe('getUserStories', () => {
    it('should call service getStories method', async () => {
      const userId = 1;
      const stories = { items: [], total: 0 };

      service.getStories.mockResolvedValue(stories as any);

      const response = await controller.getUserStories(userId);
      expect(service.getStories).toHaveBeenCalledWith(userId);
      expect(response).toEqual(stories);
    });
  });
});
