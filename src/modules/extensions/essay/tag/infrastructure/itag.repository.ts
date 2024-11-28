import { Tag } from '../../../../../entities/tag.entity';

export interface ITagRepository {
  findTag(name: string): Promise<Tag>;

  saveTag(name: string): Promise<Tag>;
}
