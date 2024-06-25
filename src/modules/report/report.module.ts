import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { EssayModule } from '../essay/essay.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReportQueue]), forwardRef(() => EssayModule)],
  providers: [ReportService, ReportRepository],
  exports: [ReportService, ReportRepository],
})
export class ReportModule {}
