import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BurialController } from './api/burial.controller';
import { BurialService } from './core/burial.service';
import { Essay } from '../../../../entities/essay.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { EssayModule } from '../../../base/essay/essay.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';
import { AlertModule } from '../../management/alert/alert.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Essay]),
    AlertModule,
    EssayModule,
    AuthModule,
    UserModule,
    ToolModule,
  ],
  controllers: [BurialController],
  providers: [BurialService],
  exports: [BurialService],
})
export class BurialModule {}
