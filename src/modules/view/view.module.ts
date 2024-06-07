import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ViewRecord } from '../../entities/viewRecord.entity';
import { ViewService } from './view.service';
import { ViewRepository } from './view.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ViewRecord])],
  providers: [ViewService, ViewRepository],
  exports: [ViewService, ViewRepository],
})
export class ViewModule {}
