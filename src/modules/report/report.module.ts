import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReportQueue } from '../../entities/reportQueue.entity';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { EssayModule } from '../essay/essay.module';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ReportQueue]), forwardRef(() => EssayModule)],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService, ReportRepository],
})
export class ReportModule {}
