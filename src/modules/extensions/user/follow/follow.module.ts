import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { User } from '../../../../entities/user.entity';
import { Follow } from '../../../../entities/follow.entity';
import { FollowService } from './core/follow.service';
import { FollowRepository } from './infrastructure/follow.repository';
import { ToolModule } from '../../../utils/tool/tool.module';
import { FollowController } from './api/follow.controller';
import { UserModule } from '../../../base/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';

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
