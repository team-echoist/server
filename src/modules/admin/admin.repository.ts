import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindManyOptions, Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ProcessedHistory } from '../../entities/processedHistory.entity';
import { Admin } from '../../entities/admin.entity';
import { AdminUpdateReqDto } from './dto/request/adminUpdateReq.dto';
import { CreateAdminDto } from './dto/createAdmin.dto';
import { Server } from '../../entities/server.entity';
import { Transactional } from 'typeorm-transactional';
import { Theme } from '../../entities/theme.entity';
import { Item } from '../../entities/item.entity';

export class AdminRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(ReportQueue) private readonly reportRepository: Repository<ReportQueue>,
    @InjectRepository(ReviewQueue) private readonly reviewRepository: Repository<ReviewQueue>,
    @InjectRepository(Admin) private readonly adminRepository: Repository<Admin>,
    @InjectRepository(ProcessedHistory)
    private readonly processedRepository: Repository<ProcessedHistory>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,

    private readonly dataSource: DataSource,
  ) {}

  async totalSubscriberCount(today: Date) {
    return this.subscriptionRepository.count({
      where: {
        endDate: Between(today, new Date('2100-01-01')),
      },
    });
  }

  async todaySubscribers(todayStart: Date, todayEnd: Date) {
    return this.subscriptionRepository.count({
      where: {
        createdDate: Between(todayStart, todayEnd),
      },
    });
  }

  async unprocessedReports() {
    return this.reportRepository.count({
      where: { processed: false },
    });
  }

  async unprocessedReviews() {
    return this.reviewRepository.count({
      where: { processed: false },
    });
  }

  async countMonthlySubscriptionPayments(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('EXTRACT(DAY FROM subscription.createdDate)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('subscription.createdDate >= :start AND subscription.createdDate <= :end', {
        start: firstDayOfMonth,
        end: lastDayOfMonth,
      })
      .groupBy('EXTRACT(DAY FROM subscription.createdDate)')
      .orderBy('EXTRACT(DAY FROM subscription.createdDate)', 'ASC')
      .getRawMany();
  }

  async countYearlySubscriptionPayments(year: number) {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('EXTRACT(MONTH FROM subscription.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM subscription.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM subscription.createdDate)')
      .orderBy('EXTRACT(MONTH FROM subscription.createdDate)', 'ASC')
      .getRawMany();
  }

  async getReports(sort: string, page: number, limit: number) {
    const totalReports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .getCount();

    const totalEssaysWithReports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .select('essay.id')
      .distinct(true)
      .getRawMany();

    const totalEssay = totalEssaysWithReports.length;

    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .select('essay.id', 'essayId')
      .addSelect('essay.title', 'essayTitle')
      .addSelect('COUNT(report.id)', 'reportCount')
      .addSelect('MIN(report.createdDate)', 'oldestReportDate')
      .leftJoin('report.essay', 'essay')
      .where('report.processed = :processed', { processed: false })
      .groupBy('essay.id');

    if (sort === 'oldest') {
      queryBuilder.addOrderBy('MIN(report.createdDate)', 'ASC');
    } else if (sort === 'most') {
      queryBuilder.addOrderBy('COUNT(report.id)', 'DESC');
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);
    const reports = await queryBuilder.getRawMany();

    return { reports, totalReports, totalEssay };
  }

  async findReportByEssayId(essayId: number) {
    return this.reportRepository.find({
      where: { essay: { id: essayId } },
      relations: ['reporter', 'essay'],
    });
  }

  async saveReport(report: ReportQueue) {
    await this.reportRepository.save(report);
    return;
  }

  async saveHistory(history: ProcessedHistory) {
    await this.processedRepository.save(history);
    return;
  }

  async getReviews(page: number, limit: number) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { processed: false },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'essay'],
      order: { createdDate: 'DESC' },
    });
    return { reviews, total };
  }

  async getReview(reviewId: number) {
    return this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['essay', 'user'],
    });
  }

  async saveReview(review: ReviewQueue) {
    return this.reviewRepository.save(review);
  }

  async getHistories(query: FindManyOptions) {
    const [histories, total] = await this.processedRepository.findAndCount(query);
    return { histories, total };
  }

  async handleBannedReports(essayIds: number[]) {
    if (essayIds.length > 0) {
      await this.reportRepository
        .createQueryBuilder()
        .update(ReportQueue)
        .set({ processed: true, processedDate: new Date() })
        .where('essay_id IN (:...essayIds)', { essayIds })
        .execute();
    }
  }

  async handleBannedReviews(userId: number) {
    await this.reviewRepository
      .createQueryBuilder()
      .update(ReviewQueue)
      .set({ processed: true, processedDate: () => 'CURRENT_TIMESTAMP' })
      .where('user_id = :userId', { userId })
      .execute();
  }

  async findByEmail(email: string) {
    return this.adminRepository.findOne({ where: { email: email } });
  }

  async findByName(name: string) {
    return this.adminRepository.findOne({ where: { name: name } });
  }

  async findAdmins(activated: boolean) {
    if (activated !== undefined) {
      return this.adminRepository.find({ where: { activated: activated } });
    }
    return this.adminRepository.find();
  }

  async findAdmin(adminId: number) {
    return this.adminRepository.findOne({ where: { id: adminId } });
  }

  async updateAdmin(admin: Admin, data: AdminUpdateReqDto) {
    const updateData = this.adminRepository.create({ ...admin, ...data });
    return await this.adminRepository.save(updateData);
  }

  async saveAdmin(admin: Admin | CreateAdminDto) {
    return this.adminRepository.save(admin);
  }

  async getCurrentServerStatus() {
    return this.serverRepository.findOne({ where: { id: 1 } });
  }

  async saveServer(server: Server) {
    return this.serverRepository.save(server);
  }

  @Transactional()
  async clearDatabase() {
    const queryRunner = this.dataSource.createQueryRunner();

    const tablesToKeep = [
      'admin',
      'app_versions',
      'basic_nickname',
      'migrations',
      'server',
      'subscriptions',
    ];

    try {
      const tables = await queryRunner.getTables([
        'alert',
        'alert_settings',
        'badge',
        'bookmark',
        'cron_log',
        'deactivation_reason',
        'device',
        'essay',
        'essay_tags',
        'follow',
        'geulroquis',
        'inquiry',
        'notice',
        'processed_history',
        'report_queue',
        'review_queue',
        'seen_notice',
        'story',
        'tag',
        'tag_exp',
        'release',
        'user',
        'view_record',
      ]);

      await queryRunner.startTransaction();

      for (const table of tables) {
        if (!tablesToKeep.includes(table.name)) {
          await queryRunner.query(`DELETE
																	 FROM "${table.name}"`);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAdminById(adminId: number) {
    return this.adminRepository.delete(adminId);
  }

  async saveTheme(newTheme: Theme) {
    return this.themeRepository.save(newTheme);
  }

  async findThemes() {
    return this.themeRepository.find();
  }

  async deleteTheme(themeId: number) {
    return this.themeRepository.delete(themeId);
  }

  async findItems(themeName?: string) {
    if (!themeName) {
      return await this.itemRepository.find();
    } else {
      return await this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.theme', 'theme')
        .where('theme.name = :themeName', { themeName: themeName })
        .getMany();
    }
  }

  async saveItem(newItem: Item) {
    return this.itemRepository.save(newItem);
  }

  async deleteItem(itemId: number) {
    return this.itemRepository.delete(itemId);
  }
}
