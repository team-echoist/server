import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BadgeController } from './api/badge.controller';
import { BadgeService } from './core/badge.service';
import { BadgeRepository } from './infrastructure/badge.repository';
import { Badge } from '../../../../entities/badge.entity';
import { Tag } from '../../../../entities/tag.entity';
import { TagExp } from '../../../../entities/tagExp.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Tag, Badge, TagExp]),
    ToolModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [BadgeController],
  providers: [BadgeService, { provide: 'IBadgeRepository', useClass: BadgeRepository }],
  exports: [BadgeService, { provide: 'IBadgeRepository', useClass: BadgeRepository }],
})
export class BadgeModule {}
