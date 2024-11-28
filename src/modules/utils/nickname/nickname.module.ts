import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { NicknameService } from './nickname.service';
import { NicknameRepository } from './nickname.repository';
import { BasicNickname } from '../../../entities/basicNickname.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BasicNickname])],
  providers: [NicknameService, NicknameRepository],
  exports: [NicknameService, NicknameRepository],
})
export class NicknameModule {}
