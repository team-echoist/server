import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { UtilsModule } from '../utils/utils.module';
import { AwsModule } from '../aws/aws.module';
import { EssayController } from './essay.controller';
import { EssayService } from './essay.service';
import { EssayRepository } from './essay.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { Category } from '../../entities/category.entity';
import { Tag } from '../../entities/tag.entity';
import * as strategies from '../../common/guards/strategies';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User, Essay, Category, ReviewQueue, Tag]),
    AuthModule,
    MailModule,
    UserModule,
    UtilsModule,
    AwsModule,
  ],
  controllers: [EssayController],
  providers: [EssayService, EssayRepository, strategies.JwtStrategy],
  exports: [EssayService, EssayRepository],
})
export class EssayModule {}
