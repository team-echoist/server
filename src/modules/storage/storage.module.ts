import { Essay } from '../../entities/essay.entity';
import { User } from '../../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { UserRepository } from '../user/user.repository';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Essay]), AwsModule],
  controllers: [StorageController],
  providers: [StorageService, UserRepository],
})
export class StorageModule {}
