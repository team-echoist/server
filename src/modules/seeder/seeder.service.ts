import { User, UserStatus } from '../../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Essay, EssayStatus } from '../../entities/essay.entity';
import { ReviewQueue, ReviewQueueType } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { UtilsService } from '../utils/utils.service';
import { Tag } from '../../entities/tag.entity';
import { Admin } from '../../entities/admin.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(ReviewQueue)
    private readonly reviewQueueRepository: Repository<ReviewQueue>,
    @InjectRepository(ReportQueue)
    private readonly reportQueueRepository: Repository<ReportQueue>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly utilsService: UtilsService,
  ) {}

  async seedAll() {
    const users = await this.seedUsers();
    const essays = await this.seedEssays(users);
    await this.seedReports(users, essays);
  }

  async seedAdmin() {
    const hashedPassword = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
    const admins = Array.from({ length: 10 }, (_, i) => ({
      email: `admin${i + 1}@linkedoutapp.com`,
      password: hashedPassword,
      active: true,
    }));
    await this.utilsService.batchProcess(admins, 2, async (batch) => {
      const adminEntities = batch.map((admin) => this.adminRepository.create(admin));
      await this.adminRepository.save(adminEntities);
    });
    console.log('Admin users created successfully');
  }

  async seedUsers() {
    const hashedPassword = await bcrypt.hash('1234', 10);
    const users = Array.from({ length: 70 }, (_, i) => ({
      email: `user${i + 1}@linkedoutapp.com`,
      password: hashedPassword,
      role: 'client',
      status: Math.random() < 0.1 ? UserStatus.MONITORED : UserStatus.ACTIVE,
      createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
      updatedDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
    }));

    const userEntities: User[] = [];
    await this.utilsService.batchProcess(users, 10, async (batch) => {
      const entities = batch.map((user) => this.userRepository.create(user));
      const savedUsers = await this.userRepository.save(entities);
      userEntities.push(...savedUsers);
    });
    console.log('Client users created successfully');
    return userEntities;
  }

  async seedEssays(users: User[]) {
    const tags = this.utilsService
      .generateRandomTags()
      .map((tagName) => this.tagRepository.create({ name: tagName, createdDate: new Date() }));
    await this.tagRepository.save(tags);

    const essays: Essay[] = [];
    await this.utilsService.batchProcess(users, 10, async (batchUsers) => {
      const batchEssays = batchUsers.flatMap((user) =>
        Array.from({ length: 30 }, () => ({
          title: this.utilsService.generateRandomTitle(),
          content: this.utilsService.generateCustomKoreanContent(),
          linkedOutGauge: Math.floor(Math.random() * 6),
          author: user,
          status: Math.random() < 0.7 ? EssayStatus.PUBLISHED : EssayStatus.LINKEDOUT,
          createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
          updatedDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
        })),
      );

      const essayEntities = batchEssays.map((essay) => this.essayRepository.create(essay));
      const savedEssays = await this.essayRepository.save(essayEntities);

      for (const savedEssay of savedEssays) {
        savedEssay.tags = tags
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 1);
        await this.essayRepository.save(savedEssay);

        if (
          savedEssay.author.status === UserStatus.MONITORED &&
          (savedEssay.status === EssayStatus.PUBLISHED ||
            savedEssay.status === EssayStatus.LINKEDOUT)
        ) {
          const reviewType = this.mapEssayStatusToReviewQueueType(savedEssay.status);
          const reviewQueue = this.reviewQueueRepository.create({
            essay: savedEssay,
            user: savedEssay.author,
            type: reviewType,
            createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
          });
          await this.reviewQueueRepository.save(reviewQueue);
          savedEssay.status = EssayStatus.PRIVATE;
          await this.essayRepository.save(savedEssay);
        }
      }
      essays.push(...savedEssays);
    });
    console.log('Essays and review queues created successfully');
    return essays;
  }

  private mapEssayStatusToReviewQueueType(status: EssayStatus): ReviewQueueType | null {
    switch (status) {
      case EssayStatus.PUBLISHED:
        return ReviewQueueType.PUBLISHED;
      case EssayStatus.LINKEDOUT:
        return ReviewQueueType.LINKEDOUT;
      default:
        return null;
    }
  }

  async seedReports(users: User[], essays: Essay[]) {
    const reports = essays.flatMap((essay) => {
      if (essay.status === EssayStatus.PRIVATE || Math.random() <= 0.8) return [];
      const potentialReporters = users.filter((u) => u.id !== essay.author.id);
      const reporter = potentialReporters[Math.floor(Math.random() * potentialReporters.length)];
      return [
        {
          essay,
          reporter,
          reason: 'Inappropriate content',
          processed: false,
        },
      ];
    });

    await this.utilsService.batchProcess(reports, 10, async (batch) => {
      const reportEntities = batch.map((report) => this.reportQueueRepository.create(report));
      await this.reportQueueRepository.save(reportEntities);
    });
    console.log('Report queues created successfully');
  }
}
