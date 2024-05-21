import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { Tag } from '../../entities/tag.entity';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay, Tag])],
  controllers: [TagController],
  providers: [TagService, TagRepository],
  exports: [TagService, TagRepository],
})
export class TagModule {}
