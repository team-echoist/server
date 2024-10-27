import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';
import { BuryService } from './bury.service';
import { BuryController } from './bury.controller';
import { AlertModule } from '../alert/alert.module';
import { EssayModule } from '../essay/essay.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Essay]),
    AlertModule,
    EssayModule,
  ],
  controllers: [BuryController],
  providers: [BuryService],
  exports: [BuryService],
})
export class BuryModule {}
