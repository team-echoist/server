import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, Tag])],
  providers: [TagService, TagRepository],
  exports: [TagService, TagRepository],
})
export class TagModule {}
