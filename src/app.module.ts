import { redisConfig } from './config/redis.config';
import { APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/base/auth/auth.module';
import { EssayModule } from './modules/base/essay/essay.module';
import { AdminModule } from './modules/base/admin/admin.module';
import { MailModule } from './modules/utils/mail/mail.module';
import { ToolModule } from './modules/utils/tool/tool.module';
import { TagModule } from './modules/features/content/tag/tag.module';
import { StoryModule } from './modules/features/content/story/story.module';
import { SeederModule } from './modules/utils/seeder/seeder.module';
import { FollowModule } from './modules/features/account/follow/follow.module';
import { BadgeModule } from './modules/features/content/badge/badge.module';
import { AwsModule } from './modules/adapters/aws/aws.module';
import { ReviewModule } from './modules/features/contact/review/review.module';
import { UserModule } from './modules/base/user/user.module';
import { ReportModule } from './modules/features/contact/report/report.module';
import { SeederService } from './modules/utils/seeder/seeder.service';
import { TimezoneMiddleware } from './common/middlewares/timezone.middleware';
import { TypeormConfig } from './config/typeorm.config';
import { ViewModule } from './modules/features/content/view/view.module';
import { BookmarkModule } from './modules/features/content/bookmark/bookmark.module';
import { CronModule } from './modules/utils/cron/cron.module';
import { SupportModule } from './modules/features/contact/support/support.module';
import { AlertModule } from './modules/features/contact/alert/alert.module';
import { GeulroquisModule } from './modules/features/content/geulroquis/geulroquis.module';
import { HomeModule } from './modules/features/account/home/home.module';
import { ServerGuard } from './common/guards/server.guard';
import * as strategies from './common/guards/strategies';
import { DeviceMiddleware } from './common/middlewares/device.middleware';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import * as process from 'node:process';
import { RequestIdMiddleware } from './common/middlewares/requestId.middleware';
import { BurialModule } from './modules/features/content/burial/burial.module';

@Module({
  imports: [
    DevtoolsModule.register({ http: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync(TypeormConfig),
    RedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
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
    RedisModule,
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
      // await this.seederService.initializeNicknames();
    }

    this.configService.set('APP_INITIALIZING', false);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceMiddleware).forRoutes('*');
    consumer.apply(TimezoneMiddleware).forRoutes('*');
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
