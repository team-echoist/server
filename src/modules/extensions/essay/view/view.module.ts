import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../entities/user.entity';
import { Essay } from '../../../../entities/essay.entity';
import { ViewRecord } from '../../../../entities/viewRecord.entity';
import { ViewService } from './view.service';
import { ViewRepository } from './view.repository';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ViewRecord]), ToolModule],
  providers: [ViewService, ViewRepository],
  exports: [ViewService, ViewRepository],
})
export class ViewModule {}
