import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TagService } from './core/tag.service';
import { TagRepository } from './infrastructure/tag.repository';
import { Essay } from '../../../../entities/essay.entity';
import { Tag } from '../../../../entities/tag.entity';
import { User } from '../../../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, Tag])],
  providers: [TagService, { provide: 'ITagRepository', useClass: TagRepository }],
  exports: [TagService, { provide: 'ITagRepository', useClass: TagRepository }],
})
export class TagModule {}
