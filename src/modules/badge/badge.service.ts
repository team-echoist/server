import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UtilsService } from '../utils/utils.service';
import { BadgeRepository } from './badge.repository';
import { Tag } from '../../entities/tag.entity';
import { User } from '../../entities/user.entity';
import { Badge } from '../../entities/badge.entity';
import { BadgeResDto } from './dto/response/badgeRes.dto';
import { BadgeWithTagResDto } from './dto/response/badgeWithTagRes.dto';

@Injectable()
export class BadgeService {
  constructor(
    private readonly badgeRepository: BadgeRepository,
    private readonly utilsService: UtilsService,
  ) {}

  private badgeTagMap = {
    분노: [
      '얄미운',
      '지겨운',
      '불쾌한',
      '못마땅한',
      '열받는',
      '불편한',
      '지루한',
      '따분한',
      '찝찝한',
      '떨떠름한',
      '언짢은',
      '심술나는',
      '괘씸한',
      '분한',
      '원망스러운',
      '신경질나는',
      '더러운',
      '끔찍한',
      '잔인한',
      '역겨운',
      '귀찮은',
      '하찮은',
      '메스꺼운',
      '넌더리나는',
      '꼴보기싫은',
      '구역질나는',
      '한심한',
      '억울한',
      '짜증스러운',
      '까칠한',
    ],
    슬픔: [
      '무거운',
      '겁나는',
      '섬뜩한',
      '한심한',
      '조급한',
      '괴로운',
      '가혹한',
      '답답한',
      '두려운',
      '무서운',
      '미운',
      '불안한',
      '불쌍한',
      '불행한',
      '속상한',
      '서러운',
      '아픈',
      '서글픈',
      '슬픈',
      '야속한',
      '안쓰러운',
      '안타까운',
      '원망스러운',
      '초조한',
      '허무한',
      '처량한',
      '울적한',
      '허탈한',
      '애처로운',
      '애끓는',
      '외로운',
      '울고싶은',
      '쓸쓸한',
      '씁쓸한',
      '침울한',
      '애석한',
      '비참한',
      '암담한',
      '막막한',
      '무기력한',
      '참담한',
      '잃은듯한',
      '숨가쁜',
      '숨막히는',
      '무기력한',
      '넋나간',
      '가여운',
      '적적한',
      '허전한',
    ],
    복잡: [
      '멍한',
      '애매한',
      '묘한',
      '서투른',
      '미심쩍은',
      '아리송한',
      '어중간한',
      '영문모를',
      '그리운',
      '궁금한',
      '떨리는',
      '무감각한',
      '무관심한',
      '혼란스러운',
    ],
    놀람: [
      '부끄러운',
      '창피한',
      '이상한',
      '민망한',
      '수줍은',
      '쑥스러운',
      '신기한',
      '놀란',
      '기묘한',
      '기이한',
      '신통한',
      '비현실적인',
      '설레는',
      '두근거리는',
      '일렁이는',
      '철렁하는',
      '짜릿한',
      '반가운',
    ],
    사랑: [
      '기쁜',
      '감격스러운',
      '고마운',
      '다행스러운',
      '달콤한',
      '벅찬',
      '사랑스러운',
      '산뜻한',
      '상쾌한',
      '상큼한',
      '신난',
      '유쾌한',
      '정겨운',
      '좋은',
      '즐거운',
      '통쾌한',
      '편안한',
      '평화로운',
      '행복한',
      '훈훈한',
      '흐뭇한',
      '포근한',
      '후련한',
      '아늑한',
      '온화한',
      '느긋한',
      '화사한',
      '자유로운',
      '따스한',
      '황홀한',
      '활기찬',
      '힘찬',
      '생생한',
      '든든한',
      '열렬한',
      '당당한',
      '충만한',
      '강렬한',
      '들뜬',
    ],
  };

  @Transactional()
  async addExperience(user: User, tags: Tag[]) {
    for (const tag of tags) {
      const badgeName = this.findBadgeByTag(tag.name);
      if (!badgeName) continue;

      if (await this.hasUserUsedTag(user.id, tag)) continue;

      const badge = await this.incrementBadgeExperience(user.id, badgeName);

      await this.markTagAsUsed(user.id, tag, badge);

      // todo 경험치가 가득 찼을 때? 알림을 보내줘야할듯
    }
  }

  private async hasUserUsedTag(userId: number, tag: Tag): Promise<boolean> {
    const tagExp = await this.badgeRepository.findUsedTag(userId, tag);
    return tagExp && tagExp.used;
  }

  private async markTagAsUsed(userId: number, tag: Tag, badge: Badge): Promise<void> {
    await this.badgeRepository.saveUsedTag(userId, tag, badge);
  }

  private async incrementBadgeExperience(userId: number, badgeName: string) {
    let userBadge = await this.badgeRepository.findBadge(userId, badgeName);
    if (!userBadge) {
      userBadge = await this.badgeRepository.createBadge(userId, badgeName);
    }

    userBadge.exp += 1;

    return await this.badgeRepository.saveBadge(userBadge);
  }

  private findBadgeByTag(tagName: string): string | null {
    for (const [badgeName, tagNames] of Object.entries(this.badgeTagMap)) {
      if (tagNames.includes(tagName)) {
        return badgeName;
      }
    }
    return null;
  }

  async levelUpBadge(userId: number, badgeName: string): Promise<void> {
    const userBadge = await this.badgeRepository.findBadge(userId, badgeName);
    if (!userBadge) {
      throw new Error('Badge not found for user.');
    }

    if (userBadge.exp < 10) {
      throw new Error('Not enough experience to level up.');
    }

    userBadge.exp -= 10;
    userBadge.level += 1;

    await this.badgeRepository.saveBadge(userBadge);
  }

  async getBadges(userId: number) {
    const userBadges = await this.badgeRepository.findBadges(userId);
    return this.utilsService.transformToDto(BadgeResDto, userBadges);
  }

  async getBadgeWithTags(userId: number) {
    const badges = await this.badgeRepository.findBadgesWithTags(userId);
    const badgesWithTags = badges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      level: badge.level,
      exp: badge.exp,
      tags: badge.tagExps.map((tagExp) => tagExp.tag.name),
    }));

    return this.utilsService.transformToDto(BadgeWithTagResDto, badgesWithTags);
  }
}
