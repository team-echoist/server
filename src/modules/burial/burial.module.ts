import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';
import { BurialService } from './burial.service';
import { BurialController } from './burial.controller';
import { AlertModule } from '../alert/alert.module';
import { EssayModule } from '../essay/essay.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Essay]),
    AlertModule,
    EssayModule,
    AuthModule,
    UserModule,
  ],
  controllers: [BurialController],
  providers: [BurialService],
  exports: [BurialService],
})
export class BurialModule {}
