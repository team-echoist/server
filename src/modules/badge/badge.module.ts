import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Tag } from '../../entities/tag.entity';
import { Badge } from '../../entities/badge.entity';
import { BadgeRepository } from './badge.repository';
import { BadgeService } from './badge.service';
import { Module } from '@nestjs/common';
import { TagExp } from '../../entities/tagExp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tag, Badge, TagExp])],
  providers: [BadgeService, BadgeRepository],
  exports: [BadgeService, BadgeRepository],
})
export class BadgeModule {}
