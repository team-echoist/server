import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { BadgeService } from './badge.service';
import { BadgeRepository } from './badge.repository';
import { User } from '../../entities/user.entity';
import { Tag } from '../../entities/tag.entity';
import { Badge } from '../../entities/badge.entity';
import { TagExp } from '../../entities/tagExp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tag, Badge, TagExp]), UtilsModule],
  providers: [BadgeService, BadgeRepository],
  exports: [BadgeService, BadgeRepository],
})
export class BadgeModule {}
