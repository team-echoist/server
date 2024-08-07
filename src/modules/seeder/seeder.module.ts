import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { UtilsModule } from '../utils/utils.module';
import { Admin } from '../../entities/admin.entity';
import { BasicNickname } from '../../entities/basicNickname.entity';
import { Server } from '../../entities/server.entity';
import { AppVersions } from '../../entities/appVersions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, BasicNickname, Server, AppVersions]), UtilsModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
