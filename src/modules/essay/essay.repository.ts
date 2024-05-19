import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { SaveEssayDto } from './dto/saveEssay.dto';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { FindMyEssayQueryInterface } from '../../common/interfaces/essay/findMyEssayQuery.interface';
import { Category } from '../../entities/category.entity';
import { UpdateEssayDto } from './dto/updateEssay.dto';

export class EssayRepository {
  constructor(
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(ReviewQueue)
    private readonly reviewRepository: Repository<ReviewQueue>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findEssayById(essayId: number) {
    return await this.essayRepository.findOne({
      where: { id: essayId },
      relations: ['author', 'category'],
    });
  }

  async findCategoryById(user: User, categoryId: number) {
    return this.categoryRepository.findOne({ where: { id: categoryId, user: user } });
  }

  async saveEssay(data: SaveEssayDto) {
    return this.essayRepository.save(data);
  }

  async saveReviewRequest(user: User, essay: Essay, type: 'published' | 'linkedOut') {
    await this.reviewRepository.save({
      user: user,
      essay: essay,
      type: type,
    });
    return;
  }

  async findReviewByEssayId(essayId: number) {
    return this.reviewRepository.findOne({ where: { essay: { id: essayId }, processed: false } });
  }

  async updateEssay(essay: Essay, data: UpdateEssayDto) {
    const essayData = this.essayRepository.create({ ...essay, ...data });
    return await this.essayRepository.save(essayData);
  }

  async findEssays(query: FindMyEssayQueryInterface, page: number, limit: number) {
    const [essays, total] = await this.essayRepository.findAndCount({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
      relations: ['author', 'category'],
    });

    return { essays, total };
  }

  async deleteEssay(essay: Essay) {
    await this.essayRepository.update(essay.id, { deletedDate: new Date() });
    return;
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
    return this.essayRepository.count({ where: { published: true } });
  }

  async totalLinkedOutEssays() {
    return this.essayRepository.count({ where: { linkedOut: true } });
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
        'essay.published',
        'essay.linkedOut',
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
