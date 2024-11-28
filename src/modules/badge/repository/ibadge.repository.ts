import { Tag } from '../../../entities/tag.entity';
import { TagExp } from '../../../entities/tagExp.entity';
import { Badge } from '../../../entities/badge.entity';

export interface IBadgeRepository {
  findUsedTag(userId: number, tag: Tag): Promise<TagExp>;

  saveUsedTag(userId: number, tag: Tag, badge: Badge): Promise<void>;

  findBadge(userId: number, badgeId: number): Promise<Badge>;

  findByBadgeName(userId: number, badgeName: string): Promise<Badge>;

  findBadges(userId: number): Promise<Badge[]>;

  createBadge(userId: number, badgeName: string): Promise<Badge>;

  saveBadge(badge: Badge): Promise<Badge>;

  findBadgesWithTags(userId: number): Promise<Badge[]>;
}
