import { Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { Tag } from '../../entities/tag.entity';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async getTags(tagNames: string[]) {
    if (!tagNames || tagNames.length === 0) return [];
    return await this.processTags(tagNames);
  }

  private async processTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) return [];

    return await Promise.all(
      tagNames.map(async (name) => {
        let tag = await this.tagRepository.findTag(name);
        if (!tag) {
          tag = await this.tagRepository.saveTag(name);
        }
        return tag;
      }),
    );
  }
}
