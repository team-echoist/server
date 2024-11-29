import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FollowController } from './api/follow.controller';
import { FollowService } from './core/follow.service';
import { FollowRepository } from './infrastructure/follow.repository';
import { Follow } from '../../../../entities/follow.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Follow]),
    ToolModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [FollowController],
  providers: [FollowService, { provide: 'IFollowRepository', useClass: FollowRepository }],
  exports: [FollowService, { provide: 'IFollowRepository', useClass: FollowRepository }],
})
export class FollowModule {}
