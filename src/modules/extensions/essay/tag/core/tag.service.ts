import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../../../../../entities/tag.entity';
import { ITagRepository } from '../infrastructure/itag.repository';

@Injectable()
export class TagService {
  constructor(@Inject('ITagRepository') private readonly tagRepository: ITagRepository) {}

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
