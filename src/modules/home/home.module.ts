import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeRepository } from './home.repository';
import { GuleroquisModule } from '../guleroquis/guleroquis.module';

@Module({
  imports: [GuleroquisModule],
  controllers: [HomeController],
  providers: [HomeService, HomeRepository],
  exports: [HomeService],
})
export class HomeModule {}
