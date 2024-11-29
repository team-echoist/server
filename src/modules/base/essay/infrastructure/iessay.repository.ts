import { UpdateResult } from 'typeorm';

import { PageType } from '../../../../common/types/enum.types';
import { Aggregate } from '../../../../entities/aggregate.entity';
import { Essay } from '../../../../entities/essay.entity';
import { SyncStatus } from '../../../../entities/sysncStatus.entity';
import { SaveEssayDto } from '../dto/saveEssay.dto';
import { UpdateEssayDto } from '../dto/updateEssay.dto';

export interface IEssayRepository {
  totalEssayCount(): Promise<number>;

  findEssayById(essayId: number): Promise<Essay>;

  findPublishedEssayById(essayId: number): Promise<Essay>;

  saveEssay(data: SaveEssayDto): Promise<Essay>;

  saveEssays(essays: Essay[]): Promise<Essay[]>;

  updateTrendScore(essayId: number, newTrendScore: number): Promise<void>;

  updateEssay(essay: Essay, data: UpdateEssayDto): Promise<Essay>;

  findEssays(
    userId: number,
    pageType: PageType,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  findTargetUserEssays(
    userId: number,
    storyId: number,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  deleteEssay(essay: Essay): Promise<void>;

  getRecommendEssays(userId: number, recentTags: number[]): Promise<Essay[]>;

  essayStatsByUserId(userId: number): Promise<any>;

  getFollowingsEssays(
    followingIds: number[],
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  findPreviousPrivateEssay(authorId: number, createdDate: Date): Promise<Essay[]>;

  findPreviousPublishEssay(authorId: number, createdDate: Date): Promise<Essay[]>;

  findPreviousStoryEssay(
    userId: number,
    authorId: number,
    storyId: number,
    createdDate: Date,
  ): Promise<Essay[]>;

  findNextEssayByPublic(authorId: number, currentEssayId: number): Promise<Essay>;

  findNextEssayByPrivate(userId: number, currentEssayId: number): Promise<Essay | null>;

  findNextEssayByStory(
    storyId: number,
    currentEssayId: number,
    excludePrivate?: boolean,
  ): Promise<Essay | null>;

  todayEssays(todayStart: Date, todayEnd: Date): Promise<number>;

  totalPublishedEssays(): Promise<number>;

  totalLinkedOutEssays(): Promise<number>;

  countEssaysByDailyThisMonth(firstDayOfMonth: Date, lastDayOfMonth: Date): Promise<any[]>;

  countEssaysByMonthlyThisYear(year: number): Promise<any[]>;

  getReportDetails(essayId: number): Promise<Essay>;

  findFullEssays(page: number, limit: number): Promise<{ essays: Essay[]; total: number }>;

  findFullEssay(essayId: number): Promise<Essay>;

  deleteAllEssay(userId: number): Promise<any>;

  restoreAllEssay(userId: number): Promise<void>;

  findByIds(userId: number, essayIds: number[]): Promise<Essay[]>;

  findToUpdateStory(
    userId: number,
    storyId: number,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  searchPublicEssays(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  searchPrivateEssays(
    userId: number,
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  searchAllEssays(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ essays: Essay[]; total: number }>;

  getWeeklyEssayCounts(userId: number, startDate: Date): Promise<any[]>;

  findEssaysLastWeek(userId: number, now: Date): Promise<number>;

  findEssaysLastMonth(userId: number, now: Date): Promise<number>;

  getRecentTags(essayIds: number[]): Promise<any[]>;

  handleUpdateEssayStatus(userIds: number[]): Promise<UpdateResult>;

  findAggregateById(essayId: number): Promise<Aggregate>;

  saveAggregate(aggregate: Aggregate): Promise<Aggregate>;

  findLastSyncTime(): Promise<SyncStatus>;

  findAggregateByLastTime(lastSyncTime: Date, offset: number, limit: number): Promise<Aggregate[]>;

  findNearbyEssaysCount(userId: number, latitude: number, longitude: number): Promise<number>;

  findNearbyEssays(userId: number, latitude: number, longitude: number): Promise<Essay[]>;

  findStoryEssays(
    storyId: number,
    page: number,
    limit: number,
    isOwner: boolean,
  ): Promise<{ essays: Essay[]; total: number }>;
}
