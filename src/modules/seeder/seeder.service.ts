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

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private readonly seederRepository: Repository<User>,
    @InjectRepository(Essay)
    private readonly essayRepository: Repository<Essay>,
    @InjectRepository(ReviewQueue)
    private readonly reviewQueueRepository: Repository<ReviewQueue>,
    @InjectRepository(ReportQueue)
    private readonly reportQueueRepository: Repository<ReportQueue>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly utilsService: UtilsService,
  ) {}

  async seedAll() {
    const users = await this.seedUsers();
    const essays = await this.seedEssays(users);
    await this.seedReports(users, essays);
  }

  async seedAdmin() {
    const createAdminPromises = [];
    const hashedPassword = await bcrypt.hash(process.env.SEED_PASSWORD, 10);

    for (let i = 1; i <= 10; i++) {
      const adminEmail = `admin${i}@linkedoutapp.com`;
      const adminUser = this.seederRepository.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });

      createAdminPromises.push(this.seederRepository.save(adminUser));
    }

    await Promise.all(createAdminPromises);
    console.log('Admin users created successfully');
  }

  async seedUsers() {
    const userPromises = [];
    const hashedPassword = await bcrypt.hash('1234', 10);

    for (let i = 1; i <= 200; i++) {
      const userEmail = `user${i}@linkedoutapp.com`;
      const isMonitored = Math.random() < 0.1;
      const userStatus = isMonitored ? UserStatus.MONITORED : UserStatus.ACTIVE;
      const user = this.seederRepository.create({
        email: userEmail,
        password: hashedPassword,
        role: 'client',
        status: userStatus,
        createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
        updatedDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
      });

      userPromises.push(this.seederRepository.save(user));
    }

    const users = await Promise.all(userPromises);
    console.log('Client users created successfully');
    return users;
  }

  async seedEssays(users: User[]) {
    const essayPromises = [];
    const reviewQueuePromises = [];
    const tagPromises = [];

    const tags = this.utilsService.generateRandomTags().map((tagName) => {
      const tag = this.tagRepository.create({ name: tagName, createdDate: new Date() });
      tagPromises.push(this.tagRepository.save(tag));
      return tag;
    });

    await Promise.all(tagPromises);

    users.forEach((user) => {
      for (let j = 0; j < 30; j++) {
        const randomValue = Math.random();
        const essayStatus = randomValue < 0.7 ? EssayStatus.PUBLISHED : EssayStatus.LINKEDOUT;

        const essay = this.essayRepository.create({
          title: this.utilsService.generateRandomTitle(),
          content: this.utilsService.generateCustomKoreanContent(),
          linkedOutGauge: Math.floor(Math.random() * 6),
          author: user,
          status: essayStatus,
          createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
          updatedDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
        });

        const essayPromise = this.essayRepository.save(essay).then(async (savedEssay) => {
          savedEssay.tags = tags
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 4) + 1);
          await this.essayRepository.save(savedEssay);

          if (
            user.status === UserStatus.MONITORED &&
            (savedEssay.status === EssayStatus.PUBLISHED ||
              savedEssay.status === EssayStatus.LINKEDOUT)
          ) {
            const reviewType = this.mapEssayStatusToReviewQueueType(savedEssay.status);
            const reviewQueue = this.reviewQueueRepository.create({
              essay: savedEssay,
              user: user,
              type: reviewType,
              createdDate: this.utilsService.getRandomDate(new Date(2020, 0, 1), new Date()),
            });
            reviewQueuePromises.push(this.reviewQueueRepository.save(reviewQueue));
            savedEssay.status = EssayStatus.PRIVATE;
            await this.essayRepository.save(savedEssay);
          }
          return savedEssay;
        });
        essayPromises.push(essayPromise);
      }
    });

    const essays = await Promise.all(essayPromises);
    await Promise.all(reviewQueuePromises);
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
    const reportPromises = [];

    essays.forEach((essay) => {
      const potentialReporters = users.filter((u) => u.id !== essay.author.id);
      const reporter = potentialReporters[Math.floor(Math.random() * potentialReporters.length)];

      const report = this.reportQueueRepository.create({
        essay: essay,
        reporter: reporter,
        reason: 'Inappropriate content',
        processed: false,
      });

      reportPromises.push(this.reportQueueRepository.save(report));
    });

    await Promise.all(reportPromises);
    console.log('Report queues created successfully');
  }
}
