import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { SeederService } from './seeder.service';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReviewQueue, ReportQueue])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}