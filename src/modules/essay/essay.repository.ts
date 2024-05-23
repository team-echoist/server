import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { SaveEssayDto } from './dto/saveEssay.dto';
import { UpdateEssayDto } from './dto/updateEssay.dto';

export class EssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
  ) {}

  async findEssayById(essayId: number) {
    return await this.essayRepository.findOne({
      where: { id: essayId },
      relations: ['author', 'category', 'tags'],
    });
  }

  async saveEssay(data: SaveEssayDto) {
    return this.essayRepository.save(data);
  }

  async updateEssay(essay: Essay, data: UpdateEssayDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    return await this.essayRepository.save(essayData);
  }

  async findEssays(
    userId: number,
    published: boolean,
    categoryId: number,
    page: number,
    limit: number,
  ) {
    const qb = this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.category', 'category')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.author.id = :userId', { userId })
      .andWhere('essay.status != :linkedOutStatus', { linkedOutStatus: EssayStatus.LINKEDOUT });

    if (categoryId !== undefined) {
      qb.andWhere('essay.category.id = :categoryId', { categoryId });
    }

    if (published !== undefined) {
      if (published) {
        qb.andWhere('essay.status = :status', { status: EssayStatus.PUBLISHED });
      } else {
        qb.andWhere('essay.status = :status', { status: EssayStatus.PRIVATE });
      }
    } else {
      qb.andWhere('essay.status IN (:...statuses)', {
        statuses: [EssayStatus.PRIVATE, EssayStatus.PUBLISHED],
      });
    }

    const [essays, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('essay.createdDate', 'DESC')
      .getManyAndCount();

    return { essays, total };
  }

  async deleteEssay(essay: Essay) {
    await this.essayRepository.update(essay.id, { deletedDate: new Date() });
    return;
  }

  async getRecommendEssays(limit: number) {
    return this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.author', 'author')
      .leftJoinAndSelect('essay.tags', 'tags')
      .where('essay.status != :status', { status: EssayStatus.PRIVATE })
      .orderBy('RANDOM()')
      .limit(limit)
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
      .select([
        'essay.id',
        'essay.title',
        'essay.content',
        'essay.linkedOutGauge',
        'essay.createdDate',
        'essay.updatedDate',
        'essay.thumbnail',
        'essay.bookmarks',
        'essay.views',
        'essay.status',
        'essay.device',
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
    const [essays, total] = await this.essayRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
      relations: ['author', 'category', 'reports', 'reviews'],
    });

    return { essays, total };
  }

  async findFullEssay(essayId: number) {
    return this.essayRepository.findOne({
      where: { id: essayId },
      relations: ['author', 'category', 'reports', 'reviews'],
    });
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
}
