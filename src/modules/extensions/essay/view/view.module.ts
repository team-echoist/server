import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ViewService } from './core/view.service';
import { ViewRepository } from './infrastructure/view.repository';
import { Essay } from '../../../../entities/essay.entity';
import { User } from '../../../../entities/user.entity';
import { ViewRecord } from '../../../../entities/viewRecord.entity';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, ViewRecord]), ToolModule],
  providers: [ViewService, { provide: 'IViewRepository', useClass: ViewRepository }],
  exports: [ViewService, { provide: 'IViewRepository', useClass: ViewRepository }],
})
export class ViewModule {}
