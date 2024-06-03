import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { StoryRepository } from './story.repository';
import { User } from '../../entities/user.entity';
import { Story } from '../../entities/story.entity';
import { StoryDto } from './dto/story.dto';
import { UtilsService } from '../utils/utils.service';
import { UserService } from '../user/user.service';

@Injectable()
export class StoryService {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async getStoryById(user: User, storyId?: number): Promise<Story> {
    if (!storyId) return null;
    const story = await this.storyRepository.findStoryById(user.id, storyId);
    if (!story) throw new HttpException('Story not found.', HttpStatus.BAD_REQUEST);
    return story;
  }

  async getStoriesByUserId(userId: number) {
    const stories = await this.storyRepository.getStoriesById(userId);
    return this.utilsService.transformToDto(StoryDto, stories);
  }

  async saveStory(userId: number, name: string) {
    const user = await this.userService.fetchUserEntityById(userId);
    return await this.saveStoryWithUser(user, name);
  }

  async updateStory(userId: number, storyId: number, categoryName: string) {
    const story: Story = await this.storyRepository.findStoryById(userId, storyId);
    story.name = categoryName;
    await this.storyRepository.saveStory(story);
  }

  async saveStoryWithUser(user: User, storyName: string) {
    const story = new Story();
    story.name = storyName;
    story.user = user;
    return await this.storyRepository.saveStory(story);
  }

  async deleteStory(userId: number, storyId: number) {
    const story: Story = await this.storyRepository.findStoryById(userId, storyId);
    await this.storyRepository.deleteStory(story);
  }
}
