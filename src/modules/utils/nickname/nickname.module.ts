import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { NicknameService } from './core/nickname.service';
import { NicknameRepository } from './infrastructure/nickname.repository';
import { BasicNickname } from '../../../entities/basicNickname.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BasicNickname])],
  providers: [NicknameService, { provide: 'INicknameRepository', useClass: NicknameRepository }],
  exports: [NicknameService, { provide: 'INicknameRepository', useClass: NicknameRepository }],
})
export class NicknameModule {}
