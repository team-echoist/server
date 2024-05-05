import { User } from '../../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';

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

    for (let i = 1; i <= 50; i++) {
      const userEmail = `user${i}@linkedoutapp.com`;
      const isBanned = Math.random() < 0.2;
      const user = this.seederRepository.create({
        email: userEmail,
        password: hashedPassword,
        role: 'client',
        banned: isBanned,
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

    users.forEach((user) => {
      for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
        const essay = this.essayRepository.create({
          title: `Sample Essay Title ${j}`,
          content: 'Sample content here...',
          linkedOutGauge: Math.floor(Math.random() * 100),
          author: user,
          published: Math.random() < 0.5,
          linkedOut: user.banned,
        });

        const essayPromise = this.essayRepository.save(essay).then((savedEssay) => {
          // Check if the user is banned and thus needs a review queue
          if (user.banned) {
            const reviewQueue = this.reviewQueueRepository.create({
              essay: savedEssay, // Use the savedEssay to ensure it's properly linked
              user: user,
              type: 'linked_out',
              createdDate: new Date(), // Assuming you want to set the created date at creation
            });
            reviewQueuePromises.push(this.reviewQueueRepository.save(reviewQueue));
          }
          return savedEssay;
        });

        essayPromises.push(essayPromise);
      }
    });

    const essays = await Promise.all(essayPromises);
    console.log('Essays and review queues created successfully');
    return essays;
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
