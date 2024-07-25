import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guleroquis } from '../../entities/guleroguis.entity';
import { GuleroquisController } from './guleroquis.controller';
import { GuleroquisService } from './guleroquis.service';
import { GuleroquisRepository } from './guleroquis.repository';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([Guleroquis]), UtilsModule],
  controllers: [GuleroquisController],
  providers: [GuleroquisService, GuleroquisRepository],
  exports: [GuleroquisService],
})
export class GuleroquisModule {}
