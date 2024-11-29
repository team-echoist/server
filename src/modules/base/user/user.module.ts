import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserCommandController } from './api/user.command.controller';
import { UserQueryController } from './api/user.query.controller';
import { UserProcessor } from './core/user.processor';
import { UserService } from './core/user.service';
import { UserRepository } from './infrastructure/user.repository';
import * as strategies from '../../../common/guards/strategies';
import { DeactivationReason } from '../../../entities/deactivationReason.entity';
import { Essay } from '../../../entities/essay.entity';
import { User } from '../../../entities/user.entity';
import { AwsModule } from '../../adapters/aws/aws.module';
import { MailModule } from '../../utils/mail/mail.module';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { AuthModule } from '../auth/auth.module';
import { EssayModule } from '../essay/essay.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Essay, DeactivationReason]),
    BullModule.registerQueueAsync({
      name: 'user',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        prefix: '{bull}',
      }),
      inject: [ConfigService],
    }),
    MailModule,
    AwsModule,
    ToolModule,
    NicknameModule,
    forwardRef(() => AuthModule),
    forwardRef(() => EssayModule),
  ],
  controllers: [UserQueryController, UserCommandController],
  providers: [
    UserService,
    { provide: 'IUserRepository', useClass: UserRepository },
    UserProcessor,
    strategies.JwtStrategy,
  ],
  exports: [UserService, { provide: 'IUserRepository', useClass: UserRepository }],
})
export class UserModule {}
