import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../utils/mail/mail.module';
import { UserModule } from '../user/user.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { ReportModule } from '../../features/contact/report/report.module';
import { ReviewModule } from '../../features/contact/review/review.module';
import { StoryModule } from '../../features/content/story/story.module';
import { TagModule } from '../../features/content/tag/tag.module';
import { AwsModule } from '../../adapters/aws/aws.module';
import { FollowModule } from '../../features/account/follow/follow.module';
import { BadgeModule } from '../../features/content/badge/badge.module';
import { EssayController } from './essay.controller';
import { EssayService } from './essay.service';
import { EssayRepository } from './essay.repository';
import { User } from '../../../entities/user.entity';
import { Essay } from '../../../entities/essay.entity';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';
import { Story } from '../../../entities/story.entity';
import { Tag } from '../../../entities/tag.entity';
import * as strategies from '../../../common/guards/strategies';
import { ViewModule } from '../../features/content/view/view.module';
import { BookmarkModule } from '../../features/content/bookmark/bookmark.module';
import { ConfigModule } from '@nestjs/config';
import { ViewRecord } from '../../../entities/viewRecord.entity';
import { AlertModule } from '../../features/contact/alert/alert.module';
import { SupportModule } from '../../features/contact/support/support.module';
import { Aggregate } from '../../../entities/aggregate.entity';
import { SyncStatus } from '../../../entities/sysncStatus.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      Essay,
      Story,
      ReviewQueue,
      Tag,
      ViewRecord,
      Aggregate,
      SyncStatus,
    ]),
    ConfigModule,
    MailModule,
    TagModule,
    StoryModule,
    ReportModule,
    ReviewModule,
    ToolModule,
    AwsModule,
    FollowModule,
    BadgeModule,
    ViewModule,
    AlertModule,
    SupportModule,
    forwardRef(() => AuthModule),
    forwardRef(() => BookmarkModule),
    forwardRef(() => UserModule),
  ],
  controllers: [EssayController],
  providers: [EssayService, EssayRepository, strategies.JwtStrategy],
  exports: [EssayService, EssayRepository],
})
export class EssayModule {}
