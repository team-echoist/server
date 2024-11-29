import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Story } from '../../../../../entities/story.entity';
import { User } from '../../../../../entities/user.entity';
import { EssayService } from '../../../../base/essay/core/essay.service';
import { StoryUpdateEssayResDto } from '../../../../base/essay/dto/response/storyUpdateEssayRes.dto';
import { UserService } from '../../../../base/user/core/user.service';
import { ToolService } from '../../../../utils/tool/core/tool.service';
import { StoryService } from '../core/story.service';
import { CreateStoryReqDto } from '../dto/repuest/createStoryReq.dto';
import { UpdateStoryReqDto } from '../dto/repuest/updateStoryReq.dto';
import { StoryDto } from '../dto/story.dto';
import { StoryRepository } from '../infrastructure/story.repository';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../infrastructure/story.repository');
jest.mock('../../../../utils/tool/core/tool.service');
jest.mock('../../user/user.service');
jest.mock('../../essay/essay.service');

describe('StoryService', () => {
  let service: StoryService;
  let storyRepository: jest.Mocked<StoryRepository>;
  let utilsService: jest.Mocked<ToolService>;
  let userService: jest.Mocked<UserService>;
  let essayService: jest.Mocked<EssayService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoryService, StoryRepository, ToolService, UserService, EssayService],
    }).compile();

    service = module.get<StoryService>(StoryService);
    storyRepository = module.get(StoryRepository);
    utilsService = module.get(ToolService);
    userService = module.get(UserService);
    essayService = module.get(EssayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoryById', () => {
    it('should return a story by id', async () => {
      const user = { id: 1 } as User;
      const storyId = 1;
      const story = { id: storyId } as Story;

      storyRepository.findStoryById.mockResolvedValue(story);

      const result = await service.getStoryById(user, storyId);

      expect(storyRepository.findStoryById).toHaveBeenCalledWith(user.id, storyId);
      expect(result).toBe(story);
    });

    it('should throw an error if story not found', async () => {
      const user = { id: 1 } as User;
      const storyId = 1;

      storyRepository.findStoryById.mockResolvedValue(null);

      await expect(service.getStoryById(user, storyId)).rejects.toThrow(
        new HttpException('스토리를 찾을 수 없습니다.', HttpStatus.BAD_REQUEST),
      );

      expect(storyRepository.findStoryById).toHaveBeenCalledWith(user.id, storyId);
    });
  });

  describe('getStories', () => {
    it('should return user stories', async () => {
      const userId = 1;
      const stories = [{ id: 1 }] as Story[];
      const storiesDto = [{ id: 1 }] as any[];

      storyRepository.findStoriesById.mockResolvedValue(stories);
      utilsService.transformToDto.mockReturnValue(storiesDto);

      const result = await service.getStories(userId);

      expect(storyRepository.findStoriesById).toHaveBeenCalledWith(userId);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(StoryDto, stories);
      expect(result).toEqual({ stories: storiesDto });
    });
  });

  describe('saveStory', () => {
    it('should save a new story', async () => {
      const userId = 1;
      const data = { name: 'New Story', essayIds: [1, 2] } as CreateStoryReqDto;
      const user = { id: userId } as User;
      const savedStory = { id: 1, name: 'New Story' } as Story;
      const essays = [
        { id: 1, story: null },
        { id: 2, story: null },
      ] as any[];

      userService.fetchUserEntityById.mockResolvedValue(user);
      storyRepository.saveStory.mockResolvedValue(savedStory);
      essayService.getEssaysByIds.mockResolvedValue(essays);

      await service.saveStory(userId, data);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(storyRepository.saveStory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Story', user }),
      );
      expect(essayService.getEssaysByIds).toHaveBeenCalledWith(userId, data.essayIds);
      expect(essayService.saveEssays).toHaveBeenCalledWith(expect.arrayContaining(essays));
    });
  });

  describe('updateStory', () => {
    it('should update an existing story', async () => {
      const userId = 1;
      const storyId = 1;
      const data = { name: 'Updated Story', essayIds: [1, 2] } as UpdateStoryReqDto;
      const story = { id: storyId, name: 'Old Story' } as Story;

      storyRepository.findStoryWithEssayById.mockResolvedValue(story);
      storyRepository.saveStory.mockResolvedValue(story);

      await service.updateStory(userId, storyId, data);

      expect(storyRepository.findStoryWithEssayById).toHaveBeenCalledWith(userId, storyId);
      expect(storyRepository.saveStory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Story' }),
      );
      expect(essayService.updatedEssaysOfStory).toHaveBeenCalledWith(userId, story, data.essayIds);
    });

    it('should throw an error if story not found', async () => {
      const userId = 1;
      const storyId = 1;
      const data = { name: 'Updated Story' } as UpdateStoryReqDto;

      storyRepository.findStoryWithEssayById.mockResolvedValue(null);

      await expect(service.updateStory(userId, storyId, data)).rejects.toThrow(
        new NotFoundException('Story not found'),
      );

      expect(storyRepository.findStoryWithEssayById).toHaveBeenCalledWith(userId, storyId);
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      const userId = 1;
      const storyId = 1;
      const story = { id: storyId } as Story;

      storyRepository.findStoryById.mockResolvedValue(story);

      await service.deleteStory(userId, storyId);

      expect(storyRepository.findStoryById).toHaveBeenCalledWith(userId, storyId);
      expect(storyRepository.nullifyEssaysInStory).toHaveBeenCalledWith(storyId);
      expect(storyRepository.deleteStory).toHaveBeenCalledWith(story);
    });

    it('should throw an error if story not found', async () => {
      const userId = 1;
      const storyId = 1;

      storyRepository.findStoryById.mockResolvedValue(null);

      await expect(service.deleteStory(userId, storyId)).rejects.toThrow(
        new HttpException('스토리를 찾을 수 없거나 사용자가 소유하지 않음', HttpStatus.NOT_FOUND),
      );

      expect(storyRepository.findStoryById).toHaveBeenCalledWith(userId, storyId);
    });
  });

  describe('updateEssayStory', () => {
    it("should update an essay's story", async () => {
      const userId = 1;
      const essayId = 1;
      const storyId = 1;
      const user = { id: userId } as User;
      const essay = { id: essayId, story: null } as any;
      const story = { id: storyId } as Story;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayService.getEssayById.mockResolvedValue(essay);
      essayService.checkEssayPermissions.mockResolvedValue(undefined);
      service.getStoryById = jest.fn().mockResolvedValue(story);

      await service.updateEssayStory(userId, essayId, storyId);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(essayService.checkEssayPermissions).toHaveBeenCalledWith(essay, userId);
      expect(service.getStoryById).toHaveBeenCalledWith(user, storyId);
      expect(essayService.updateStoryOfEssay).toHaveBeenCalledWith(
        expect.objectContaining({ id: essayId, story }),
      );
    });
  });

  describe('deleteEssayStory', () => {
    it("should delete an essay's story", async () => {
      const userId = 1;
      const essayId = 1;

      await service.deleteEssayStory(userId, essayId);

      expect(essayService.deleteEssayStory).toHaveBeenCalledWith(userId, essayId);
    });
  });

  describe('getEssayToUpdateStory', () => {
    it('should return essays to update story', async () => {
      const userId = 1;
      const storyId = 1;
      const page = 1;
      const limit = 10;
      const essays = [{ id: 1, title: 'Essay', createdDate: new Date(), story: null }] as any[];
      const total = 1;
      const totalPage = 1;

      essayService.getEssayToUpdateStory.mockResolvedValue({ essays, total });
      utilsService.transformToDto.mockReturnValue(essays);

      const result = await service.getEssayToUpdateStory(userId, storyId, page, limit);

      expect(essayService.getEssayToUpdateStory).toHaveBeenCalledWith(userId, storyId, page, limit);
      expect(utilsService.transformToDto).toHaveBeenCalledWith(
        StoryUpdateEssayResDto,
        expect.any(Array),
      );
      expect(result).toEqual({ essays, totalPage, page, total });
    });
  });
});
