import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../utils/utils.module';
import { BadgeService } from './service/badge.service';
import { BadgeRepository } from './repository/badge.repository';
import { User } from '../../entities/user.entity';
import { Tag } from '../../entities/tag.entity';
import { Badge } from '../../entities/badge.entity';
import { TagExp } from '../../entities/tagExp.entity';
import { BadgeController } from './controller/badge.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Tag, Badge, TagExp]),
    UtilsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [BadgeController],
  providers: [BadgeService, { provide: 'IBadgeRepository', useClass: BadgeRepository }],
  exports: [BadgeService, { provide: 'IBadgeRepository', useClass: BadgeRepository }],
})
export class BadgeModule {}
