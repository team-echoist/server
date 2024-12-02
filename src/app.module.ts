import * as process from 'node:process';

import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

import { ServerGuard } from './common/guards/server.guard';
import * as strategies from './common/guards/strategies';
import { DeviceMiddleware } from './common/middlewares/device.middleware';
import { RequestIdMiddleware } from './common/middlewares/requestId.middleware';
import { TimezoneMiddleware } from './common/middlewares/timezone.middleware';
import { redisConfig } from './config/redis.config';
import { TypeormConfig } from './config/typeorm.config';
import { AwsModule } from './modules/adapters/aws/aws.module';
import { AdminModule } from './modules/base/admin/admin.module';
import { AuthModule } from './modules/base/auth/auth.module';
import { EssayModule } from './modules/base/essay/essay.module';
import { UserModule } from './modules/base/user/user.module';
import { BadgeModule } from './modules/extensions/essay/badge/badge.module';
import { BookmarkModule } from './modules/extensions/essay/bookmark/bookmark.module';
import { BurialModule } from './modules/extensions/essay/burial/burial.module';
import { GeulroquisModule } from './modules/extensions/essay/geulroquis/geulroquis.module';
import { StoryModule } from './modules/extensions/essay/story/story.module';
import { TagModule } from './modules/extensions/essay/tag/tag.module';
import { ViewModule } from './modules/extensions/essay/view/view.module';
import { AlertModule } from './modules/extensions/management/alert/alert.module';
import { ReportModule } from './modules/extensions/management/report/report.module';
import { ReviewModule } from './modules/extensions/management/review/review.module';
import { SupportModule } from './modules/extensions/management/support/support.module';
import { FollowModule } from './modules/extensions/user/follow/follow.module';
import { HomeModule } from './modules/extensions/user/home/home.module';
import { CronModule } from './modules/utils/cron/cron.module';
import { MailModule } from './modules/utils/mail/mail.module';
import { SeederService } from './modules/utils/seeder/core/seeder.service';
import { SeederModule } from './modules/utils/seeder/seeder.module';
import { ToolModule } from './modules/utils/tool/tool.module';

@Module({
  imports: [
    DevtoolsModule.register({ http: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync(TypeormConfig),
    RedisModule,
    AdminModule,
    UserModule,
    SeederModule,
    AuthModule,
    EssayModule,
    ReportModule,
    ReviewModule,
    TagModule,
    FollowModule,
    StoryModule,
    MailModule,
    ToolModule,
    AwsModule,
    BadgeModule,
    ViewModule,
    BookmarkModule,
    CronModule,
    SupportModule,
    AlertModule,
    GeulroquisModule,
    HomeModule,
    BurialModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ServerGuard },
    strategies.AdminPassStrategy,
    strategies.LocalStrategy,
    strategies.JwtStrategy,
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(
    private readonly seederService: SeederService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.configService.set('APP_INITIALIZING', true);

    if (process.env.SEED === 'true') {
      await this.seederService.initializeServer();
      await this.seederService.initializeAdmin();
      await this.seederService.initializeAppVersions();
      await this.seederService.initializeDefaultTheme();
      // await this.seederService.initializeNicknames()
    }

    this.configService.set('APP_INITIALIZING', false);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceMiddleware).forRoutes('*');
    consumer.apply(TimezoneMiddleware).forRoutes('*');
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
