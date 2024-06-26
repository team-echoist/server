import { redisConfig } from './config/redis.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { UtilsModule } from './modules/utils/utils.module';
import { TagModule } from './modules/tag/tag.module';
import { StoryModule } from './modules/story/story.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { FollowModule } from './modules/follow/follow.module';
import { BadgeModule } from './modules/badge/badge.module';
import { AwsModule } from './modules/aws/aws.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';
import { ReportModule } from './modules/report/report.module';
import { SeederService } from './modules/seeder/seeder.service';
import { JwtInterceptor } from './common/interceptros/jwt.interceptor';
import { DeviceInterceptor } from './common/interceptros/device.interceptor';
import { TimezoneMiddleware } from './common/middlewares/timezone.middleware';
import { TypeormConfig } from './config/typeorm.config';
import { ViewModule } from './modules/view/view.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { BlockPhpRequestsMiddleware } from './common/middlewares/blockPhpRequests.middleware';
import { CronService } from './modules/cron/cron.service';
import { CronModule } from './modules/cron/cron.module';
import { SupportModule } from './modules/support/support.module';
import { AlertModule } from './modules/alert/alert.module';

@Module({
  imports: [
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
    UtilsModule,
    AwsModule,
    BadgeModule,
    ViewModule,
    BookmarkModule,
    CronModule,
    SupportModule,
    AlertModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DeviceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JwtInterceptor },
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(
    private readonly seederService: SeederService,
    private readonly cronService: CronService,
  ) {}

  async onModuleInit() {
    await this.cronService.startCronJobs();
    if (process.env.INITIALIZE === 'true') {
      await this.seederService.initializeAdmin();
      await this.seederService.initializeNicknames();
      await this.seederService.initializeAll();
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimezoneMiddleware).forRoutes('*');
    consumer.apply(BlockPhpRequestsMiddleware).forRoutes('*');
  }
}
