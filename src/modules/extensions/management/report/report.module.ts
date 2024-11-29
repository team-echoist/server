import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportController } from './api/report.controller';
import { ReportService } from './core/report.service';
import { ReportRepository } from './infrastructure/report.repository';
import { Essay } from '../../../../entities/essay.entity';
import { ReportQueue } from '../../../../entities/reportQueue.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { EssayModule } from '../../../base/essay/essay.module';
import { UserModule } from '../../../base/user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Essay, ReportQueue]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => EssayModule),
  ],
  controllers: [ReportController],
  providers: [ReportService, { provide: 'IReporter', useClass: ReportRepository }],
  exports: [ReportService, { provide: 'IReporter', useClass: ReportRepository }],
})
export class ReportModule {}
