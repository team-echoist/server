import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UtilsService } from '../utils/utils.service';
import { Admin } from '../../entities/admin.entity';
import { BasicNickname } from '../../entities/basicNickname.entity';
import { Server, ServerStatus } from '../../entities/server.entity';
import { AppType, AppVersions } from '../../entities/appVersions.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(BasicNickname)
    private readonly basicNicknameRepository: Repository<BasicNickname>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(AppVersions)
    private readonly appVersionsRepository: Repository<AppVersions>,

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
    const admin = await this.adminRepository.findOne({ where: { id: 1 } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const newAdmin = new Admin();
      newAdmin.email = 'root@linkedoutapp.com';
      newAdmin.password = hashedPassword;
      newAdmin.activated = true;
      await this.adminRepository.save(newAdmin);
      console.log('Root Admin created successfully');
    } else {
      console.log('Root Admin already exists');
    }
    return;
  }

  async initializeServer() {
    const server = await this.serverRepository.find();
    if (server.length === 0) {
      const newServer = new Server();
      newServer.status = ServerStatus.OPEN;
      await this.serverRepository.save(newServer);
      console.log('Server status created successfully');
    } else {
      console.log('Server state already exists');
    }
    return;
  }

  async initializeAppVersions() {
    const versions = await this.appVersionsRepository.find();

    if (versions.length === 6) {
      console.log('The app version exists normally.');
      return;
    }

    const initialVersions = [
      { appType: AppType.ANDROID_MOBILE, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.ANDROID_TABLET, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.IOS_MOBILE, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.IOS_TABLET, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.DESCKTOP_MAC, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.DESCKTOP_WINDOWS, version: '0.0.0', releaseDate: new Date() },
    ];

    await this.appVersionsRepository.save(initialVersions);
    console.log('New app version has been created.');
  }
}
