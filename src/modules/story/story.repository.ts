import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../../entities/story.entity';

export class StoryRepository {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
  ) {}

  async findStoryById(userId: number, storyId: number) {
    return this.storyRepository.findOne({ where: { id: storyId, user: { id: userId } } });
  }

  async getStoriesById(userId: number) {
    return this.storyRepository.find({ where: { user: { id: userId } } });
  }

  async saveStory(story: Story) {
    return this.storyRepository.save(story);
  }

  async deleteStory(story: Story) {
    return this.storyRepository.remove(story);
  }
}
