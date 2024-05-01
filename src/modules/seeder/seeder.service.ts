import { User } from '../../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private readonly seederRepository: Repository<User>,
  ) {}

  async seed() {
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
}
