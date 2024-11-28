import { Module } from '@nestjs/common';
import { AwsService } from './core/aws.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {}
