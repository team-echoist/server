import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../../entities/badge.entity';
import { TagExp } from '../../entities/tagExp.entity';
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

  async saveUsedTag(userId: number, tag: Tag, badge: Badge) {
    const tagExp = this.tagExpRepository.create({
      user: { id: userId },
      tag: { id: tag.id },
      badge: badge,
      used: true,
    });

    await this.tagExpRepository.save(tagExp);
  }

  async findBadge(userId: number, badgeId: number) {
    return this.badgeRepository.findOne({ where: { user: { id: userId }, id: badgeId } });
  }

  async findByBadgeName(userId: number, badgeName: string) {
    return this.badgeRepository.findOne({ where: { user: { id: userId }, name: badgeName } });
  }

  async findBadges(userId: number) {
    return this.badgeRepository.find({ where: { user: { id: userId } } });
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

  async findBadgesWithTags(userId: number) {
    return this.badgeRepository.find({
      where: { user: { id: userId } },
      relations: ['tagExps', 'tagExps.tag'],
    });
  }
}
