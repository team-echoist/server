import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Essay } from '../../../../entities/essay.entity';
import { User } from '../../../../entities/user.entity';
import { BurialService } from './burial.service';
import { BurialController } from './burial.controller';
import { AlertModule } from '../../contact/alert/alert.module';
import { EssayModule } from '../../../base/essay/essay.module';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

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
