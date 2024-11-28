import * as strategies from '../../../common/guards/strategies';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../utils/mail/mail.module';
import { AwsModule } from '../../adapters/aws/aws.module';
import { EssayModule } from '../essay/essay.module';
import { ToolModule } from '../../utils/tool/tool.module';
import { UserController } from './api/user.controller';
import { UserRepository } from './infrastructure/user.repository';
import { UserService } from './core/user.service';
import { User } from '../../../entities/user.entity';
import { Essay } from '../../../entities/essay.entity';
import { NicknameModule } from '../../utils/nickname/nickname.module';
import { DeactivationReason } from '../../../entities/deactivationReason.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { UserProcessor } from './core/user.processor';
import { IUserRepository } from './infrastructure/iuser.repository';

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
  controllers: [UserController],
  providers: [
    UserService,
    { provide: 'IUserRepository', useClass: UserRepository },
    UserProcessor,
    strategies.JwtStrategy,
  ],
  exports: [UserService, { provide: 'IUserRepository', useClass: UserRepository }],
})
export class UserModule {}
