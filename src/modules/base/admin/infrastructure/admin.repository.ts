import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindManyOptions, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { IAdminRepository } from './iadmin.repository';
import { Admin } from '../../../../entities/admin.entity';
import { AppVersions } from '../../../../entities/appVersions.entity';
import { Item } from '../../../../entities/item.entity';
import { ProcessedHistory } from '../../../../entities/processedHistory.entity';
import { ReportQueue } from '../../../../entities/reportQueue.entity';
import { ReviewQueue } from '../../../../entities/reviewQueue.entity';
import { Server } from '../../../../entities/server.entity';
import { Subscription } from '../../../../entities/subscription.entity';
import { Theme } from '../../../../entities/theme.entity';
import { ToolService } from '../../../utils/tool/core/tool.service';
import { CreateAdminDto } from '../dto/createAdmin.dto';
import { AdminUpdateReqDto } from '../dto/request/adminUpdateReq.dto';

export class AdminRepository implements IAdminRepository {
  constructor(
    @InjectRepository(Admin) private readonly adminRepository: Repository<Admin>,
    @InjectRepository(ReportQueue) private readonly reportRepository: Repository<ReportQueue>,
    @InjectRepository(ReviewQueue) private readonly reviewRepository: Repository<ReviewQueue>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(ProcessedHistory)
    private readonly processedRepository: Repository<ProcessedHistory>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(AppVersions)
    private readonly appVersionsRepository: Repository<AppVersions>,
    private readonly dataSource: DataSource,
    private readonly toolService: ToolService,
  ) {}

  async totalSubscriberCount(today: Date) {
    const subscribeCount = await this.subscriptionRepository.count({
      where: {
        endDate: Between(today, new Date('2100-01-01')),
      },
    });

    this.toolService.assertExists(subscribeCount);
    return subscribeCount;
  }

  async todaySubscribers(todayStart: Date, todayEnd: Date) {
    const subscribers = await this.subscriptionRepository.count({
      where: {
        createdDate: Between(todayStart, todayEnd),
      },
    });

    this.toolService.assertExists(subscribers);
    return subscribers;
  }

  async unprocessedReports() {
    const reports = await this.reportRepository.count({
      where: { processed: false },
    });

    this.toolService.assertExists(reports);
    return reports;
  }

  async unprocessedReviews() {
    const reviews = await this.reviewRepository.count({
      where: { processed: false },
    });
    this.toolService.assertExists(reviews);
    return reviews;
  }

  async countMonthlySubscriptionPayments(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    const count = await this.subscriptionRepository
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

    this.toolService.assertExists(count);
    return count;
  }

  async countYearlySubscriptionPayments(year: number) {
    const count = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('EXTRACT(MONTH FROM subscription.createdDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM subscription.createdDate) = :year', { year: year })
      .groupBy('EXTRACT(MONTH FROM subscription.createdDate)')
      .orderBy('EXTRACT(MONTH FROM subscription.createdDate)', 'ASC')
      .getRawMany();

    this.toolService.assertExists(count);
    return count;
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

    this.toolService.assertExists(reports);
    return { reports, totalReports, totalEssay };
  }

  async findReportByEssayId(essayId: number) {
    const reports = await this.reportRepository.find({
      where: { essay: { id: essayId } },
      relations: ['reporter', 'essay'],
    });

    this.toolService.assertExists(reports);
    return reports;
  }

  async saveReport(report: ReportQueue) {
    await this.reportRepository.save(report);
  }

  async saveHistory(history: ProcessedHistory) {
    await this.processedRepository.save(history);
  }

  async getReviews(page: number, limit: number) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { processed: false },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'essay'],
      order: { createdDate: 'DESC' },
    });

    this.toolService.assertExists(reviews);
    return { reviews, total };
  }

  async getReview(reviewId: number) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['essay', 'user'],
    });

    this.toolService.assertExists(review);
    return review;
  }

  async saveReview(review: ReviewQueue) {
    const savedReview = await this.reviewRepository.save(review);

    this.toolService.assertExists(savedReview);
    return savedReview;
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

  async findAdmins(
    page: number,
    limit: number,
    activated: boolean | undefined,
  ): Promise<{
    admins: Admin[];
    total: number;
  }> {
    const [admins, total] = await this.adminRepository.findAndCount({
      where: activated !== undefined ? { activated } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { createdDate: 'DESC' },
    });
    return { admins, total };
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

  async findThemeById(themeId: number) {
    return this.themeRepository.findOne({ where: { id: themeId } });
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

  async findAllVersions() {
    return this.appVersionsRepository.find();
  }

  async findVersion(versionId: number) {
    return this.appVersionsRepository.findOne({ where: { id: versionId } });
  }

  async saveVersion(version: AppVersions) {
    return this.appVersionsRepository.save(version);
  }
}
