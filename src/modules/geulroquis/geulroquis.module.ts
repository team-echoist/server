import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geulroquis } from '../../entities/geulroguis.entity';
import { GeulroquisController } from './geulroquis.controller';
import { GeulroquisService } from './geulroquis.service';
import { GeulroquisRepository } from './geulroquis.repository';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([Geulroquis]), UtilsModule],
  controllers: [GeulroquisController],
  providers: [GeulroquisService, GeulroquisRepository],
  exports: [GeulroquisService],
})
export class GeulroquisModule {}
