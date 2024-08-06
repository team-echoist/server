import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UtilsService } from '../utils/utils.service';
import { Admin } from '../../entities/admin.entity';
import { BasicNickname } from '../../entities/basicNickname.entity';
import { Server, ServerStatus } from '../../entities/server.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(BasicNickname)
    private readonly basicNicknameRepository: Repository<BasicNickname>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly utilsService: UtilsService,
  ) {}

  async initializeNicknames(): Promise<void> {
    console.log('Basic nickname created started');
    const nicknames: any = [];
    const maxDigits = 5;

    for (let digits = 3; digits <= maxDigits; digits++) {
      const maxNumber = Math.pow(10, digits) - 1;
      for (let i = 1; i <= maxNumber; i++) {
        const nickname = this.utilsService.numberToKoreanString(i);
        nicknames.push({ nickname, isUsed: false });
      }
    }

    await this.utilsService.batchProcess(nicknames, 5000, async (batch) => {
      try {
        await this.basicNicknameRepository
          .createQueryBuilder()
          .insert()
          .into(BasicNickname)
          .values(batch)
          .orIgnore()
          .execute();
      } catch (error) {
        console.error('Error inserting batch:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });

    console.log('Basic nickname created successfully');
  }

  async initializeAdmin() {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = new Admin();
    admin.email = 'root@linkedoutapp.com';
    admin.password = hashedPassword;
    admin.activated = true;
    await this.adminRepository.save(admin);
    console.log('Admin created successfully');
  }

  async initializeServer() {
    const server = new Server();
    server.status = ServerStatus.OPEN;
    await this.serverRepository.save(server);
    console.log('Server created successfully');
  }
}
