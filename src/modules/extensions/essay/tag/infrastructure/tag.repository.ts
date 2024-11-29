import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ITagRepository } from './itag.repository';
import { Tag } from '../../../../../entities/tag.entity';

export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findTag(name: string) {
    return this.tagRepository.findOne({ where: { name } });
  }

  async saveTag(name: string) {
    const tag = this.tagRepository.create({ name });
    return await this.tagRepository.save(tag);
  }
}
