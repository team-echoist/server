import { Module } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
