import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { User } from '../../../../entities/user.entity';
import { Essay } from '../../../../entities/essay.entity';
import { ReportQueue } from '../../../../entities/reportQueue.entity';
import { ReportService } from './core/report.service';
import { ReportRepository } from './infrastructure/report.repository';
import { EssayModule } from '../../../base/essay/essay.module';
import { ReportController } from './api/report.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';
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
