import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { SeederService } from './seeder.service';
import { Essay } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { UtilsModule } from '../utils/utils.module';
import { Admin } from '../../entities/admin.entity';
import { BasicNickname } from '../../entities/basicNickname.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Essay, ReviewQueue, ReportQueue, Tag, Admin, BasicNickname]),
    UtilsModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
