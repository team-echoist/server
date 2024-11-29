import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ToolService } from './core/tool.service';

@Module({
  imports: [ConfigModule],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
