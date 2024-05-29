import { InjectRepository } from '@nestjs/typeorm';
import { Badge } from '../../entities/badge.entity';
import { TagExp } from '../../entities/tagExp.entity';
import { Repository } from 'typeorm';
import { Tag } from '../../entities/tag.entity';

export class BadgeRepository {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(TagExp)
    private readonly tagExpRepository: Repository<TagExp>,
  ) {}

  async findUsedTag(userId: number, tag: Tag) {
    return this.tagExpRepository.findOne({ where: { user: { id: userId }, tag: { id: tag.id } } });
  }

  async saveUsedTag(userId: number, tag: Tag) {
    const tagExp = this.tagExpRepository.create({
      user: { id: userId },
      tag: { id: tag.id },
      used: true,
    });

    await this.tagExpRepository.save(tagExp);
  }

  async findBadge(userId: number, badgeName: string) {
    return this.badgeRepository.findOne({ where: { user: { id: userId }, name: badgeName } });
  }

  async createBadge(userId: number, badgeName: string) {
    return this.badgeRepository.create({
      user: { id: userId },
      name: badgeName,
      level: 0,
      exp: 0,
    });
  }

  async saveBadge(badge: Badge) {
    return this.badgeRepository.save(badge);
  }
}
