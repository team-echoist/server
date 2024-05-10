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
    return await this.categoryRepository.findOne({ where: { id: categoryId, user: user } });
  }

  async saveEssay(data: SaveEssayDto) {
    return await this.essayRepository.save(data);
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

  async findMyEssay(query: FindMyEssayQueryInterface, page: number, limit: number) {
    const [essays, total] = await this.essayRepository.findAndCount({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
    });

    return { essays, total };
  }

  async deleteEssay(essay: Essay) {
    await this.essayRepository.delete(essay.id);
    return;
  }

  // ------------------------------------------------------admin api
  async totalEssayCount() {
    return await this.essayRepository.count();
  }

  async todayEssays(todayStart: Date, todayEnd: Date) {
    return await this.essayRepository.count({
      where: { createdDate: Between(todayStart, todayEnd) },
    });
  }

  async totalPublishedEssays() {
    return await this.essayRepository.count({ where: { published: true } });
  }

  async totalLinkedOutEssays() {
    return await this.essayRepository.count({ where: { linkedOut: true } });
  }

  async getReportDetails(essayId: number) {
    return await this.essayRepository
      .createQueryBuilder('essay')
      .leftJoinAndSelect('essay.reports', 'report', 'report.processed = :processed', {
        processed: false,
      })
      .leftJoin('report.reporter', 'reporter') // Join without selecting all fields
      .leftJoin('essay.author', 'author') // Assuming 'author' is a relation on the Essay entity
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
}
