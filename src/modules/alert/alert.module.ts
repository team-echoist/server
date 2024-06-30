import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../entities/alert.entity';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AlertRepository } from './alert.repository';
import { User } from '../../entities/user.entity';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, User]), UtilsModule],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository],
  exports: [AlertService, AlertRepository],
})
export class AlertModule {}
