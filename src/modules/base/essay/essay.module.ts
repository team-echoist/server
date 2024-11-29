import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EssayCommandController } from './api/essay.command.controller';
import { EssayQueryController } from './api/essay.query.controller';
import { EssayService } from './core/essay.service';
import { EssayRepository } from './infrastructure/essay.repository';
import * as strategies from '../../../common/guards/strategies';
import { Aggregate } from '../../../entities/aggregate.entity';
import { Essay } from '../../../entities/essay.entity';
import { ReviewQueue } from '../../../entities/reviewQueue.entity';
import { Story } from '../../../entities/story.entity';
import { SyncStatus } from '../../../entities/sysncStatus.entity';
import { Tag } from '../../../entities/tag.entity';
import { User } from '../../../entities/user.entity';
import { ViewRecord } from '../../../entities/viewRecord.entity';
import { AwsModule } from '../../adapters/aws/aws.module';
import { BadgeModule } from '../../extensions/essay/badge/badge.module';
import { BookmarkModule } from '../../extensions/essay/bookmark/bookmark.module';
import { StoryModule } from '../../extensions/essay/story/story.module';
import { TagModule } from '../../extensions/essay/tag/tag.module';
import { ViewModule } from '../../extensions/essay/view/view.module';
import { AlertModule } from '../../extensions/management/alert/alert.module';
import { ReportModule } from '../../extensions/management/report/report.module';
import { ReviewModule } from '../../extensions/management/review/review.module';
import { SupportModule } from '../../extensions/management/support/support.module';
import { FollowModule } from '../../extensions/user/follow/follow.module';
import { MailModule } from '../../utils/mail/mail.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

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
  controllers: [EssayQueryController, EssayCommandController],
  providers: [
    EssayService,
    { provide: 'IEssayRepository', useClass: EssayRepository },
    strategies.JwtStrategy,
  ],
  exports: [EssayService, { provide: 'IEssayRepository', useClass: EssayRepository }],
})
export class EssayModule {}
