import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoryRepository } from './story.repository';
import { User } from '../../../../entities/user.entity';
import { Story } from '../../../../entities/story.entity';
import { StoryDto } from './dto/story.dto';
import { ToolService } from '../../../utils/tool/tool.service';
import { UserService } from '../../../base/user/user.service';
import { CreateStoryReqDto } from './dto/repuest/createStoryReq.dto';
import { EssayService } from '../../../base/essay/core/essay.service';
import { Transactional } from 'typeorm-transactional';
import { StoryUpdateEssayResDto } from '../../../base/essay/dto/response/storyUpdateEssayRes.dto';
import { UpdateStoryReqDto } from './dto/repuest/updateStoryReq.dto';

@Injectable()
export class StoryService {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly utilsService: ToolService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => EssayService)) private readonly essayService: EssayService,
  ) {}

  async getStoryById(user: User, storyId?: number): Promise<Story> {
    if (!storyId) return null;
    const story = await this.storyRepository.findStoryById(user.id, storyId);
    if (!story) throw new HttpException('스토리를 찾을 수 없습니다.', HttpStatus.BAD_REQUEST);
    return story;
  }

  async getStories(userId: number) {
    const stories = await this.storyRepository.findStoriesById(userId);
    const storiesDto = this.utilsService.transformToDto(StoryDto, stories);

    return { stories: storiesDto };
  }

  @Transactional()
  async saveStory(userId: number, data: CreateStoryReqDto) {
    const user = await this.userService.fetchUserEntityById(userId);

    const stories = await this.storyRepository.findStoriesById(userId);
    const isNameDuplicate = stories.some((story) => story.name === data.name);
    if (isNameDuplicate) {
      throw new HttpException('이미 같은 이름의 스토리가 존재합니다.', HttpStatus.BAD_REQUEST);
    }

    const savedStory = await this.saveStoryWithUser(user, data.name);

    if (data.essayIds && data.essayIds.length > 0) {
      const essays = await this.essayService.getEssaysByIds(userId, data.essayIds);
      essays.forEach((essay) => {
        essay.story = savedStory;
      });
      await this.essayService.saveEssays(essays);
    }

    return this.utilsService.transformToDto(StoryDto, savedStory);
  }

  @Transactional()
  async updateStory(userId: number, storyId: number, data: UpdateStoryReqDto) {
    const story = await this.storyRepository.findStoryWithEssayById(userId, storyId);
    if (!story) throw new NotFoundException('스토리를 찾을 수 없습니다.');

    if (data.name && data.name.trim() !== '') {
      const stories = await this.storyRepository.findStoriesById(userId);
      const isNameDuplicate = stories.some(
        (existingStory) => existingStory.id !== storyId && existingStory.name === data.name,
      );

      if (isNameDuplicate) {
        throw new HttpException('이미 같은 이름의 스토리가 존재합니다.', HttpStatus.BAD_REQUEST);
      }

      story.name = data.name;
    }
    await this.storyRepository.saveStory(story);

    if (data.essayIds && data.essayIds.length > 0)
      await this.essayService.updatedEssaysOfStory(userId, story, data.essayIds);
  }

  async saveStoryWithUser(user: User, storyName: string) {
    const story = new Story();
    story.name = storyName;
    story.user = user;
    return await this.storyRepository.saveStory(story);
  }

  @Transactional()
  async deleteStory(userId: number, storyId: number) {
    const story: Story = await this.storyRepository.findStoryById(userId, storyId);
    if (!story)
      throw new HttpException(
        '스토리를 찾을 수 없거나 사용자가 소유하지 않음',
        HttpStatus.NOT_FOUND,
      );

    await this.storyRepository.nullifyEssaysInStory(storyId);
    await this.storyRepository.deleteStory(story);
  }

  @Transactional()
  async updateEssayStory(userId: number, essayId: number, storyId: number) {
    const user = await this.userService.fetchUserEntityById(userId);
    const essay = await this.essayService.getEssayById(essayId);

    await this.essayService.checkEssayPermissions(essay, userId);

    essay.story = await this.getStoryById(user, storyId);

    await this.essayService.updateStoryOfEssay(essay);
  }

  async deleteEssayStory(userId: number, essayId: number) {
    return this.essayService.deleteEssayStory(userId, essayId);
  }

  @Transactional()
  async getEssayToUpdateStory(userId: number, storyId: number, page: number, limit: number) {
    const { essays, total } = await this.essayService.getEssayToUpdateStory(
      userId,
      storyId,
      page,
      limit,
    );
    const totalPage: number = Math.ceil(total / limit);

    const transformedEssays = essays.map((essay) => ({
      id: essay.id,
      title: essay.title,
      createdDate: essay.createdDate,
      story: essay.story ? essay.story.id : null,
    }));

    const essaysDto = this.utilsService.transformToDto(StoryUpdateEssayResDto, transformedEssays);

    const currentStoryName = await this.utilsService.findStoryNameInEssays(essays);

    return { essays: essaysDto, totalPage, page, total, currentStoryName };
  }

  async getStoryEssays(userId: number, storyId: number, page: number, limit: number) {
    const storyOwner = await this.getStoryOwner(userId, storyId);
    const isOwner = !!storyOwner;

    return await this.essayService.getStoryEssays(storyId, page, limit, isOwner);
  }

  async getStoryOwner(userId: number, storyId: number) {
    const isOwner = await this.storyRepository.findStoryById(userId, storyId);
    if (!isOwner) throw new HttpException('조회 권한이 없습니다.', HttpStatus.BAD_REQUEST);

    return !!isOwner;
  }
}
