import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { UtilsModule } from '../utils/utils.module';
import { ReportModule } from '../report/report.module';
import { ReviewModule } from '../review/review.module';
import { StoryModule } from '../story/story.module';
import { TagModule } from '../tag/tag.module';
import { AwsModule } from '../aws/aws.module';
import { FollowModule } from '../follow/follow.module';
import { BadgeModule } from '../badge/badge.module';
import { EssayController } from './essay.controller';
import { EssayService } from './essay.service';
import { EssayRepository } from './essay.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { ReviewQueue } from '../../entities/reviewQueue.entity';
import { Story } from '../../entities/story.entity';
import { Tag } from '../../entities/tag.entity';
import * as strategies from '../../common/guards/strategies';
import * as dotenv from 'dotenv';
import { ViewModule } from '../view/view.module';
import { BookmarkModule } from '../bookmark/bookmark.module';
import { ConfigModule } from '@nestjs/config';
import { ViewRecord } from '../../entities/viewRecord.entity';
import { AlertModule } from '../alert/alert.module';
import { SupportModule } from '../support/support.module';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([User, Essay, Story, ReviewQueue, Tag, ViewRecord]),
    ConfigModule,
    AuthModule,
    MailModule,
    TagModule,
    StoryModule,
    ReportModule,
    ReviewModule,
    UtilsModule,
    AwsModule,
    FollowModule,
    BadgeModule,
    ViewModule,
    AlertModule,
    SupportModule,
    forwardRef(() => BookmarkModule),
    forwardRef(() => UserModule),
  ],
  controllers: [EssayController],
  providers: [EssayService, EssayRepository, strategies.JwtStrategy],
  exports: [EssayService, EssayRepository],
})
export class EssayModule {}
