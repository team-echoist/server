import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolModule } from '../../../utils/tool/tool.module';
import { BadgeService } from './core/badge.service';
import { BadgeRepository } from './infrastructure/badge.repository';
import { User } from '../../../../entities/user.entity';
import { Tag } from '../../../../entities/tag.entity';
import { Badge } from '../../../../entities/badge.entity';
import { TagExp } from '../../../../entities/tagExp.entity';
import { BadgeController } from './api/badge.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';

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
