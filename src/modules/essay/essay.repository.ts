import { InjectRepository } from '@nestjs/typeorm';
import { Between, Brackets, In, Repository } from 'typeorm';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { SaveEssayDto } from './dto/saveEssay.dto';
import { UpdateEssayDto } from './dto/updateEssay.dto';
import { Bookmark } from '../../entities/bookmark.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';

export class EssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
  ) {}

  async findEssayById(essayId: number) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.id = :id', { id: essayId })
      .getOne();
  }

  async findPublishedEssayById(essayId: number) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.id = :id', { id: essayId })
      .andWhere('essay.status != :status', { status: EssayStatus.PRIVATE })
      .getOne();
  }

  async saveEssay(data: SaveEssayDto) {
    return this.essayRepository.save(data);
  }

  async saveEssays(essays: Essay[]) {
    return this.essayRepository.save(essays);
  }

  async incrementViews(essay: Essay, newViews: number) {
    return await this.essayRepository.update(essay.id, { views: newViews });
  }

  async updateTrendScore(essayId: number, newTrendScore: number) {
    await this.essayRepository.update(essayId, { trendScore: newTrendScore });
  }

  async updateEssay(essay: Essay, data: UpdateEssayDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    return await this.essayRepository.save(essayData);
  }

  async findEssays(
    userId: number,
    published: boolean,
    storyId: number,
    page: number,
    limit: number,
  ) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.author.id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT });

    if (storyId !== undefined) {
      queryBuilder.andWhere('essay.story.id = :storyId', { storyId });
    }

    if (published !== undefined) {
      if (published) {
        queryBuilder.andWhere('essay.status = :status', { status: EssayStatus.PUBLISHED });
      } else {
        queryBuilder.andWhere('essay.status = :status', { status: EssayStatus.PRIVATE });
      }
    } else {
      queryBuilder.andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PRIVATE, EssayStatus.PUBLISHED],
      });
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);

    const [essays, total] = await queryBuilder
      .orderBy('essay.createdDate', 'DESC')
      .getManyAndCount();

    return { essays, total };
  }

  async findTargetUserEssays(userId: number, storyId: number, page: number, limit: number) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.author.id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT })
      .andWhere('essay.status != :privateStatus', { privateStatus: EssayStatus.PRIVATE });

    if (storyId !== undefined) {
      queryBuilder.andWhere('essay.story.id = :storyId', { storyId });
      queryBuilder.orderBy('essay.createdDate', 'ASC');
    } else {
      queryBuilder.orderBy('essay.createdDate', 'DESC');
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);

    const [essays, total] = await queryBuilder.getManyAndCount();

    return { essays, total };
  }

  async deleteEssay(essay: Essay) {
    await this.essayRepository.update(essay.id, { deletedDate: new Date() });
  }

  async getRecommendEssays(userId: number, recentTags: number[]) {
    const bookmarkWeight = 0.2;
    const tagWeight = 0.2;
    const trendWeight = 0.3;
    const reputationWeight = 0.3;
    const largerPoolLimit = 500;

    recentTags = recentTags || [];

    return this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author', 'author.deletedDate IS NULL')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('"bookmark"."essay_id"', 'essay_id')
            .addSelect('COUNT("bookmark"."id")', 'bookmarkCount')
            .from(Bookmark, 'bookmark')
            .groupBy('"bookmark"."essay_id"'),
        'bookmarkCounts',
        '"bookmarkCounts"."essay_id" = "essay"."id"',
      )
      .leftJoin('essay.tags', 'tags')
      .where('essay.status != :status', { status: EssayStatus.PRIVATE })
      .andWhere('essay.deletedDate IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('"reportQueue"."essay_id"')
          .from(ReportQueue, 'reportQueue')
          .where('"reportQueue"."reporter_id" = :userId')
          .getQuery();
        return `"essay"."id" NOT IN ${subQuery}`;
      })
      .addSelect(
        `
      ${bookmarkWeight} * COALESCE("bookmarkCounts"."bookmarkCount", 0) +
      ${trendWeight} * essay.trendScore +
      ${reputationWeight}  * COALESCE(author.reputation, 0)
      ${recentTags.length > 0 ? ` + ${tagWeight} * COALESCE(SUM(CASE WHEN tags.id IN (:...recentTags) THEN 1 ELSE 0 END), 0)` : ''}
    `,
        'weighted_score',
      )
      .groupBy('essay.id, author.id, "bookmarkCounts"."bookmarkCount"')
      .orderBy('weighted_score', 'DESC')
      .limit(largerPoolLimit)
      .setParameter('recentTags', recentTags)
      .setParameter('userId', userId)
      .getMany();
  }

  async essayStatsByUserId(userId: number) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .select('author.id', 'authorId')
      .addSelect('COUNT(*)', 'totalEssays')
      .addSelect(
        `COUNT(CASE WHEN essay.status = '${EssayStatus.PUBLISHED}' THEN 1 END)`,
        'publishedEssays',
      )
      .addSelect(
        `COUNT(CASE WHEN essay.status = '${EssayStatus.LINKEDOUT}' THEN 1 END)`,
        'linkedOutEssays',
      )
      .innerJoin('essay.author', 'author')
      .where('author.id = :userId', { userId })
      .groupBy('author.id')
      .getRawOne();
  }

  async getFollowingsEssays(followingIds: number[], page: number, limit: number) {
    const total = await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoin('essay.author', 'author')
      .where('essay.author.id IN (:...followingIds)', { followingIds })
      .andWhere('essay.status = :status', { status: EssayStatus.PUBLISHED })
      .getCount();

    const subQueryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .select('essay.id')
      .leftJoin('essay.author', 'author')
      .where('essay.author.id IN (:...followingIds)', { followingIds })
      .andWhere('essay.status = :status', { status: EssayStatus.PUBLISHED })
      .orderBy('essay.createdDate', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const subQuery = subQueryBuilder.getQuery();

    const essays = await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where(`essay.id IN (${subQuery})`)
      .setParameters(subQueryBuilder.getParameters())
      .orderBy('essay.createdDate', 'DESC')
      .getMany();

    return { essays, total };
  }

  async findPreviousMyEssay(authorId: number, createdDate: Date) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author.id = :authorId', { authorId })
      .andWhere('essay.status != :status', { status: EssayStatus.LINKEDOUT })
      .andWhere('essay.created_date < :createdDate', { createdDate })
      .orderBy('essay.created_date', 'DESC')
      .limit(6)
      .getMany();
  }

  async findPreviousEssay(authorId: number, createdDate: Date) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author.id = :authorId', { authorId })
      .andWhere('essay.status = :status', { status: EssayStatus.PUBLISHED })
      .andWhere('essay.created_date < :createdDate', { createdDate })
      .orderBy('essay.created_date', 'DESC')
      .limit(6)
      .getMany();
  }

  // ------------------------------------------------------admin api
  async totalEssayCount() {
    return this.essayRepository.count();
  }

  async todayEssays(todayStart: Date, todayEnd: Date) {
    return await this.essayRepository.count({
      where: { createdDate: Between(todayStart, todayEnd) },
    });
  }

  async totalPublishedEssays() {
    return this.essayRepository.count({ where: { status: EssayStatus.PUBLISHED } });
  }

  async totalLinkedOutEssays() {
    return this.essayRepository.count({ where: { status: EssayStatus.LINKEDOUT } });
  }

  async countEssaysByDailyThisMonth(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    return this.essayRepository
      .createQueryBuilder('essay')
      .select('EXTRACT(DAY FROM essay.createdDate)', 'day') // 날짜 대신 일자만 추출
      .addSelect('COUNT(*)', 'count')
      .where('essay.createdDate >= :start AND essay.createdDate <= :end', {
        start: firstDayOfMonth,
        end: lastDayOfMonth,
      })
      .groupBy('EXTRACT(DAY FROM essay.createdDate)')
      .orderBy('EXTRACT(DAY FROM essay.createdDate)', 'ASC')
      .getRawMany();
  }

  async countEssaysByMonthlyThisYear(year: number) {
    return this.essayRepository
      .createQueryBuilder('essay')
      .select('EXTRACT(MONTH FROM essay.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM essay.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM essay.createdDate)')
      .orderBy('EXTRACT(MONTH FROM essay.createdDate)', 'ASC')
      .getRawMany();
  }

  async getReportDetails(essayId: number) {
    return this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.reports', 'report', 'report.processed = :processed', {
        processed: false,
      })
      .leftJoin('report.reporter', 'reporter')
      .leftJoin('essay.author', 'author')
      .leftJoinAndSelect('essay.bookmarks', 'bookmark')
      .leftJoinAndSelect('essay.device', 'device')
      .select([
        'essay.id',
        'essay.title',
        'essay.content',
        'essay.linkedOutGauge',
        'essay.createdDate',
        'essay.updatedDate',
        'essay.thumbnail',
        'essay.views',
        'essay.status',
        'device.os',
        'device.type',
        'device.model',
        'author.id',
      ])
      .addSelect([
        'report.id',
        'report.reason',
        'report.processed',
        'report.processedDate',
        'report.createdDate',
        'reporter.id',
      ])
      .where('essay.id = :id', { id: essayId })
      .getOne();
  }

  async findFullEssays(page: number, limit: number) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.reports', 'reports')
      .leftJoinAndSelect('essay.reviews', 'reviews')
      .leftJoinAndSelect(
        'essay.author',
        'author',
        'author.deletedDate IS NOT NULL OR author.deletedDate IS NULL',
      )
      .withDeleted()
      .orderBy('essay.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [essays, total] = await queryBuilder.withDeleted().getManyAndCount();

    return { essays, total };
  }

  async findFullEssay(essayId: number) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.reports', 'reports')
      .leftJoinAndSelect('essay.reviews', 'reviews')
      .leftJoinAndSelect(
        'essay.author',
        'author',
        'author.deletedDate IS NOT NULL OR author.deletedDate IS NULL',
      )
      .where('essay.id = :essayId', { essayId });

    return await queryBuilder.withDeleted().getOne();
  }

  async deleteAllEssay(userId: number) {
    const deletedEssay = await this.essayRepository
      .createQueryBuilder()
      .update(Essay)
      .set({ deletedDate: new Date() })
      .where('author_id = :userId', { userId })
      .returning('id')
      .execute();

    return deletedEssay.raw.map((essay: any) => essay.id);
  }

  async restoreAllEssay(userId: number) {
    await this.essayRepository
      .createQueryBuilder()
      .update(Essay)
      .set({ deletedDate: null })
      .where('author_id = :userId', { userId })
      .execute();
    return;
  }

  async findByIds(userId: number, essayIds: number[]) {
    return this.essayRepository.find({
      where: {
        id: In(essayIds),
        author: { id: userId },
      },
    });
  }

  async findToUpdateStory(userId: number, storyId: number, page: number, limit: number) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.story', 'story')
      .where('essay.author = :userId', { userId });

    if (storyId) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('story.id = :storyId', { storyId });
        }),
      );
    } else {
      queryBuilder.andWhere('essay.story IS NULL');
    }

    queryBuilder
      .select(['essay.id', 'essay.title', 'essay.createdDate', 'story.id'])
      .offset((page - 1) * limit)
      .limit(limit)
      .orderBy('essay.createdDate', 'DESC');

    const [essays, total] = await queryBuilder.getManyAndCount();

    return { essays, total };
  }

  // 버전1: 토큰매치 방식(빠름)
  // async searchEssays(keyword: string, page: number, limit: number) {
  //   const offset = (page - 1) * limit;
  //
  //   const query = this.essayRepository
  //     .createQueryBuilder('essay')
  //     .addSelect(
  //       `ts_rank_cd(search_vector, plainto_tsquery('simple', unaccent(:keyword)))`,
  //       'relevance',
  //     )
  //     .where('essay.deleted_date IS NULL AND search_vector @@ plainto_tsquery(:keyword)', {
  //       keyword,
  //     })
  //     .andWhere('essay.status IN (:...statuses)', {
  //       statuses: [EssayStatus.PUBLISHED, EssayStatus.LINKEDOUT],
  //     });
  //
  //   const [essays, total] = await query
  //     .orderBy('relevance', 'DESC')
  //     .offset(offset)
  //     .limit(limit)
  //     .getManyAndCount();
  //
  //   return { essays, total };
  // }

  // 버전2: 유사도 매치
  async searchEssays(keyword: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const useTrigramSearch = keyword.length >= 3;

    const query = this.essayRepository.createQueryBuilder('essay');

    if (useTrigramSearch) {
      query
        .addSelect(
          `0.5 * (
        similarity(unaccented_title, :keyword) +
        similarity(unaccented_content, :keyword)
      )`,
          'relevance',
        )
        .where(
          'essay.deleted_date IS NULL AND (unaccented_title ILIKE :wildcardKeyword OR unaccented_content ILIKE :wildcardKeyword)',
          { keyword, wildcardKeyword: `%${keyword}%` },
        );
    } else {
      query
        .addSelect(
          `0.5 * ts_rank_cd(search_vector, plainto_tsquery('simple', :keyword)) +
       0.5 * (
         similarity(unaccented_title, :keyword) +
         similarity(unaccented_content, :keyword)
       )`,
          'relevance',
        )
        .where(
          'essay.deleted_date IS NULL AND (search_vector @@ plainto_tsquery(:keyword) OR ' +
            'unaccented_title ILIKE :wildcardKeyword OR unaccented_content ILIKE :wildcardKeyword)',
          { keyword, wildcardKeyword: `%${keyword}%` },
        );
    }

    query
      .andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PUBLISHED, EssayStatus.LINKEDOUT],
      })
      .orderBy('relevance', 'DESC')
      .offset(offset)
      .limit(limit);

    const [essays, total] = await query.getManyAndCount();

    return { essays, total };
  }

  async getWeeklyEssayCounts(userId: number, startDate: Date) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .select("DATE_TRUNC('week', essay.createdDate) AS weekstart")
      .addSelect('COUNT(*)', 'count')
      .where('essay.author.id = :userId AND essay.createdDate >= :start', {
        userId,
        start: startDate,
      })
      .groupBy("DATE_TRUNC('week', essay.createdDate)")
      .orderBy('weekstart', 'ASC')
      .getRawMany();
  }

  async findEssaysLastWeek(userId: number, now: Date) {
    return this.essayRepository.count({
      where: {
        author: { id: userId },
        createdDate: Between(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), now),
      },
    });
  }

  async findEssaysLastMonth(userId: number, now: Date) {
    return await this.essayRepository.count({
      where: {
        author: { id: userId },
        createdDate: Between(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), now),
      },
    });
  }

  async getRecentTags(essayIds: number[]) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .innerJoin('essay.tags', 'tag')
      .select('DISTINCT tag.id', 'tagId')
      .where('essay.id IN (:...essayIds)', { essayIds })
      .getRawMany();
  }

  async handleUpdateEssayStatus(userIds: number[]) {
    return await this.essayRepository
      .createQueryBuilder()
      .update(Essay)
      .set({ status: EssayStatus.PRIVATE })
      .where('author_id IN (:...userIds)', { userIds })
      .andWhere('status = :status', { status: EssayStatus.PUBLISHED })
      .execute();
  }
}
