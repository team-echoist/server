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

  async findStoryWithEssayById(userId: number, storyId: number) {
    return this.storyRepository.findOne({
      where: { id: storyId, user: { id: userId } },
      relations: ['essays'],
    });
  }

  async getStoriesById(userId: number) {
    return this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.essays', 'essay')
      .loadRelationCountAndMap('story.essaysCount', 'story.essays')
      .where('story.user.id = :userId', { userId })
      .getMany();
  }

  async saveStory(story: Story) {
    return this.storyRepository.save(story);
  }

  async deleteStory(story: Story) {
    return this.storyRepository.remove(story);
  }
}
