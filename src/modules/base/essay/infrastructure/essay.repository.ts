import { InjectRepository } from '@nestjs/typeorm';
import { Between, Brackets, In, MoreThan, Repository } from 'typeorm';

import { IEssayRepository } from './iessay.repository';
import { EssayStatus, PageType } from '../../../../common/types/enum.types';
import { Aggregate } from '../../../../entities/aggregate.entity';
import { Bookmark } from '../../../../entities/bookmark.entity';
import { Essay } from '../../../../entities/essay.entity';
import { ReportQueue } from '../../../../entities/reportQueue.entity';
import { SyncStatus } from '../../../../entities/sysncStatus.entity';
import { SaveEssayDto } from '../dto/saveEssay.dto';
import { UpdateEssayDto } from '../dto/updateEssay.dto';

export class EssayRepository implements IEssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(Aggregate)
    private readonly aggregateRepository: Repository<Aggregate>,
    @InjectRepository(SyncStatus)
    private readonly syncStatusRepository: Repository<SyncStatus>,
  ) {}

  async totalEssayCount() {
    return await this.essayRepository.count();
  }

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
    const result = await this.essayRepository
      .createQueryBuilder()
      .insert()
      .into('essay')
      .values({
        title: data.title,
        content: data.content,
        linkedOutGauge: data.linkedOutGauge,
        thumbnail: data.thumbnail,
        status: data.status,
        device: data.device,
        author: data.author,
        createdDate: new Date(),
        updatedDate: new Date(),
        coordinates:
          data.longitude && data.latitude
            ? () => `ST_SetSRID(ST_GeomFromText('POINT(${data.longitude} ${data.latitude})'), 4326)`
            : null,
      })
      .returning('*')
      .execute();

    const insertedEssayId = result.identifiers[0].id;

    const savedEssay = await this.essayRepository.findOne({
      where: { id: insertedEssayId },
      relations: ['tags', 'author', 'device'],
    });

    if (data.tags && data.tags.length > 0) {
      savedEssay.tags = data.tags;

      await this.essayRepository.save(savedEssay);
    }

    return savedEssay;
  }

  async saveEssays(essays: Essay[]) {
    return this.essayRepository.save(essays);
  }

  async updateTrendScore(essayId: number, newTrendScore: number) {
    await this.essayRepository.update(essayId, { trendScore: newTrendScore });
  }

  async updateEssay(essay: Essay, data: UpdateEssayDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    return await this.essayRepository.save(essayData);
  }

  async findEssays(userId: number, pageType: PageType, page: number, limit: number) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.author.id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT })
      .andWhere('essay.status != :burialStatus', { burialStatus: EssayStatus.BURIAL });

    if (pageType === PageType.PUBLIC) {
      queryBuilder.andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PUBLISHED, EssayStatus.PUBLIC],
      });
    } else if (pageType === PageType.PRIVATE) {
      queryBuilder.andWhere('essay.status = :status', {
        status: EssayStatus.PRIVATE,
      });
    }

    const [essays, total] = await queryBuilder
      .orderBy('essay.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { essays, total };
  }

  async findTargetUserEssays(userId: number, storyId: number, page: number, limit: number) {
    const subQuery = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .where('essay.author_id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT })
      .andWhere('essay.status != :privateStatus', { privateStatus: EssayStatus.PRIVATE })
      .andWhere('essay.status != :burialStatus', { burialStatus: EssayStatus.BURIAL })
      .andWhere('essay.deletedDate IS NULL');

    if (storyId !== undefined) {
      subQuery.andWhere('essay.story_id = :storyId', { storyId });
    }

    const idsResult = await subQuery
      .orderBy('essay.createdDate', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const essayIds = idsResult.map((row) => row.essay_id);

    if (essayIds.length === 0) {
      return { essays: [], total: 0 };
    }

    const total = await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author_id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT })
      .andWhere('essay.status != :privateStatus', { privateStatus: EssayStatus.PRIVATE })
      .andWhere('essay.status != :burialStatus', { burialStatus: EssayStatus.BURIAL })
      .andWhere('essay.deletedDate IS NULL')
      .getCount();

    const essays = await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.tags', 'tags')
      .leftJoinAndSelect('essay.story', 'story')
      .whereInIds(essayIds)
      .orderBy('essay.createdDate', 'DESC')
      .getMany();

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
      .andWhere('essay.status != :burialStatus', { burialStatus: EssayStatus.BURIAL })
      .andWhere('essay.deletedDate IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('essay.status != :linkedOutStatus', {
            linkedOutStatus: EssayStatus.LINKEDOUT,
          }).orWhere('essay.author.id != :userId', { userId });
        }),
      )
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
        `COUNT(CASE WHEN essay.status IN ('${EssayStatus.PUBLISHED}', '${EssayStatus.PUBLIC}') THEN 1 END)`,
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
      .andWhere('(essay.status = :publishedStatus OR essay.status = :publicStatus)', {
        publishedStatus: EssayStatus.PUBLISHED,
        publicStatus: EssayStatus.PUBLIC,
      })
      .getCount();

    const subQueryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .select('essay.id')
      .leftJoin('essay.author', 'author')
      .where('essay.author.id IN (:...followingIds)', { followingIds })
      .andWhere('(essay.status = :publishedStatus OR essay.status = :publicStatus)', {
        publishedStatus: EssayStatus.PUBLISHED,
        publicStatus: EssayStatus.PUBLIC,
      })
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

  async findPreviousPrivateEssay(authorId: number, createdDate: Date) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author.id = :authorId', { authorId })
      .andWhere('essay.status = :status', { status: EssayStatus.PRIVATE })
      .andWhere('essay.created_date < :createdDate', { createdDate })
      .orderBy('essay.created_date', 'DESC')
      .limit(6)
      .getMany();
  }

  async findPreviousPublishEssay(authorId: number, createdDate: Date) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author.id = :authorId', { authorId })
      .andWhere('(essay.status = :publishedStatus OR essay.status = :publicStatus)', {
        publishedStatus: EssayStatus.PUBLISHED,
        publicStatus: EssayStatus.PUBLIC,
      })
      .andWhere('essay.created_date < :createdDate', { createdDate })
      .orderBy('essay.created_date', 'DESC')
      .limit(6)
      .getMany();
  }

  async findPreviousStoryEssay(
    userId: number,
    authorId: number,
    storyId: number,
    createdDate: Date,
  ) {
    const query = this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.story.id = :storyId', { storyId })
      .andWhere('essay.created_date < :createdDate', { createdDate });

    if (authorId !== userId) {
      query.andWhere('essay.status != :status', { status: EssayStatus.PRIVATE });
    }

    return await query.orderBy('essay.created_date', 'DESC').limit(6).getMany();
  }

  async findNextEssayByPublic(authorId: number, currentEssayId: number) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .andWhere('essay.author.id = :authorId', { authorId })
      .andWhere('(essay.status = :publishedStatus OR essay.status = :publicStatus)', {
        publishedStatus: EssayStatus.PUBLISHED,
        publicStatus: EssayStatus.PUBLIC,
      })
      .andWhere('essay.id > :currentEssayId', { currentEssayId })
      .orderBy('essay.created_date', 'ASC')
      .getOne();
  }

  async findNextEssayByPrivate(userId: number, currentEssayId: number): Promise<Essay | null> {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .where('essay.author.id = :userId', { userId })
      .andWhere('essay.status = :status', { status: EssayStatus.PRIVATE })
      .andWhere('essay.id > :currentEssayId', { currentEssayId })
      .orderBy('essay.created_date', 'ASC')
      .getOne();
  }

  async findNextEssayByStory(
    storyId: number,
    currentEssayId: number,
    excludePrivate?: boolean,
  ): Promise<Essay | null> {
    const query = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .where('essay.story.id = :storyId', { storyId })
      .andWhere('essay.id > :currentEssayId', { currentEssayId })
      .orderBy('essay.created_date', 'ASC');

    if (excludePrivate) {
      query.andWhere('essay.status != :status', { status: EssayStatus.PRIVATE });
    }

    return await query.getOne();
  }

  async todayEssays(todayStart: Date, todayEnd: Date) {
    return await this.essayRepository.count({
      where: { createdDate: Between(todayStart, todayEnd) },
    });
  }

  async totalPublishedEssays() {
    return this.essayRepository.count({
      where: { status: In([EssayStatus.PUBLISHED, EssayStatus.PUBLIC]) },
    });
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
      .leftJoinAndSelect('essay.author', 'author', 'author.deletedDate IS NULL')
      .withDeleted()
      .orderBy('essay.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [essays, total] = await queryBuilder.getManyAndCount();

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
      .where('essay.author = :userId', { userId })
      .andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PUBLISHED, EssayStatus.PUBLIC, EssayStatus.PRIVATE],
      });

    if (storyId) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('story.id = :storyId', { storyId }).orWhere('essay.story IS NULL');
        }),
      );
    } else {
      queryBuilder.andWhere('essay.story IS NULL');
    }

    queryBuilder
      .select(['essay.id', 'essay.title', 'essay.createdDate', 'story.id', 'story.name'])
      .offset((page - 1) * limit)
      .limit(limit)
      .orderBy('essay.createdDate', 'DESC');

    const [essays, total] = await queryBuilder.getManyAndCount();

    return { essays, total };
  }

  async searchPublicEssays(keyword: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const useTrigramSearch = keyword.length >= 3;
    const query = this.essayRepository.createQueryBuilder('essay');

    if (useTrigramSearch) {
      query
        .addSelect(
          `0.5 * (
        similarity(unaccented_title, :keyword) +
        similarity(unaccented_content, :keyword)
      ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
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
       ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
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
        statuses: [EssayStatus.PUBLISHED, EssayStatus.PUBLIC, EssayStatus.LINKEDOUT],
      })
      .orderBy('relevance', 'DESC')
      .offset(offset)
      .limit(limit);

    const [essays, total] = await query.getManyAndCount();

    return { essays, total };
  }

  async searchPrivateEssays(userId: number, keyword: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const useTrigramSearch = keyword.length >= 3;
    const query = this.essayRepository.createQueryBuilder('essay');

    if (useTrigramSearch) {
      query
        .addSelect(
          `0.5 * (
        similarity(unaccented_title, :keyword) +
        similarity(unaccented_content, :keyword)
      ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
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
       ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
          'relevance',
        )
        .where(
          'essay.deleted_date IS NULL AND (search_vector @@ plainto_tsquery(:keyword) OR ' +
            'unaccented_title ILIKE :wildcardKeyword OR unaccented_content ILIKE :wildcardKeyword)',
          { keyword, wildcardKeyword: `%${keyword}%` },
        );
    }

    query.andWhere('essay.author.id = :userId', { userId });

    query.andWhere('essay.status NOT IN (:...statuses)', {
      statuses: [EssayStatus.LINKEDOUT, EssayStatus.BURIAL],
    });

    query.orderBy('relevance', 'DESC').offset(offset).limit(limit);

    const [essays, total] = await query.getManyAndCount();

    return { essays, total };
  }

  async searchAllEssays(keyword: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const useTrigramSearch = keyword.length >= 3;

    const query = this.essayRepository.createQueryBuilder('essay');

    if (useTrigramSearch) {
      query
        .addSelect(
          `0.5 * (
        similarity(unaccented_title, :keyword) +
        similarity(unaccented_content, :keyword)
      ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
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
       ) +  0.6 * (1 / EXTRACT(EPOCH FROM (NOW() - essay.created_date)))`,
          'relevance',
        )
        .where(
          'essay.deleted_date IS NULL AND (search_vector @@ plainto_tsquery(:keyword) OR ' +
            'unaccented_title ILIKE :wildcardKeyword OR unaccented_content ILIKE :wildcardKeyword)',
          { keyword, wildcardKeyword: `%${keyword}%` },
        );
    }

    query.orderBy('relevance', 'DESC').offset(offset).limit(limit);

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
      .andWhere('(essay.status = :publishedStatus OR essay.status = :publicStatus)', {
        publishedStatus: EssayStatus.PUBLISHED,
        publicStatus: EssayStatus.PUBLIC,
      })
      .execute();
  }

  async findAggregateById(essayId: number) {
    return await this.aggregateRepository.findOne({ where: { essayId: essayId } });
  }

  async saveAggregate(aggregate: Aggregate) {
    return await this.aggregateRepository.save(aggregate);
  }

  async findLastSyncTime() {
    const syncStatusRecords = await this.syncStatusRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return syncStatusRecords[0] || null;
  }

  async findAggregateByLastTime(lastSyncTime: Date, offset: number, limit: number) {
    return this.aggregateRepository.find({
      where: { updatedDate: MoreThan(lastSyncTime) },
      skip: offset,
      take: limit,
    });
  }

  async findNearbyEssaysCount(
    userId: number,
    latitude: number,
    longitude: number,
  ): Promise<number> {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author_id = :userId', { userId })
      .andWhere('essay.coordinates IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          essay.coordinates,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
          1000
        )`,
        { latitude, longitude },
      )
      .getCount();
  }

  async findNearbyEssays(userId: number, latitude: number, longitude: number): Promise<Essay[]> {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .where('essay.author_id = :userId', { userId })
      .andWhere('essay.coordinates IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          essay.coordinates,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
          1000
        )`,
        { latitude, longitude },
      )
      .getMany();
  }

  async findStoryEssays(storyId: number, page: number, limit: number, isOwner: boolean) {
    const queryBuilder = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.story', 'story')
      .where('essay.story_id = :storyId', { storyId });

    if (isOwner) {
      queryBuilder.andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PRIVATE, EssayStatus.PUBLIC, EssayStatus.PUBLISHED],
      });
    } else {
      queryBuilder.andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PUBLIC, EssayStatus.PUBLISHED],
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [essays, total] = await queryBuilder.getManyAndCount();
    return { essays, total };
  }
}
