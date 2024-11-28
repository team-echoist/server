import { Story } from '../../../../../entities/story.entity';

export interface IStoryRepository {
  findStoryById(userId: number, storyId: number): Promise<Story>;

  findStoryWithEssayById(userId: number, storyId: number): Promise<Story>;

  findStoriesById(userId: number): Promise<Story[]>;

  saveStory(story: Story): Promise<Story>;

  deleteStory(story: Story): Promise<Story>;

  nullifyEssaysInStory(storyId: number): Promise<void>;
}
