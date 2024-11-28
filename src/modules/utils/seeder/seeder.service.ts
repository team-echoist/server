import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ToolService } from '../tool/tool.service';
import { Admin } from '../../../entities/admin.entity';
import { BasicNickname } from '../../../entities/basicNickname.entity';
import { Server } from '../../../entities/server.entity';
import { AppVersions } from '../../../entities/appVersions.entity';
import { AppType, ServerStatus } from '../../../common/types/enum.types';

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

    private readonly utilsService: ToolService,
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
    const root = await this.adminRepository.findOne({ where: { id: 1 } });
    if (!root) {
      const hashedPassword = await bcrypt.hash(process.env.ROOT_PASSWORD, 12);
      const newRoot = new Admin();
      newRoot.email = process.env.ROOT_EMAIL;
      newRoot.name = process.env.ROOT_NAME;
      newRoot.password = hashedPassword;
      newRoot.activated = true;
      await this.adminRepository.save(newRoot);
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
      { appType: AppType.DESKTOP_MAC, version: '0.0.0', releaseDate: new Date() },
      { appType: AppType.DESKTOP_WINDOWS, version: '0.0.0', releaseDate: new Date() },
    ];

    await this.appVersionsRepository.save(initialVersions);
    console.log('New app version has been created.');
  }
}
