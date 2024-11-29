import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IStoryRepository } from './istory.repository';
import { Essay } from '../../../../../entities/essay.entity';
import { Story } from '../../../../../entities/story.entity';

export class StoryRepository implements IStoryRepository {
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

  async findStoriesById(userId: number) {
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

  async nullifyEssaysInStory(storyId: number) {
    await this.storyRepository
      .createQueryBuilder()
      .update(Essay)
      .set({ story: null })
      .where('story.id = :storyId', { storyId })
      .execute();
  }
}
