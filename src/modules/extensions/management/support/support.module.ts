import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from '../../../../entities/notice.entity';
import { Inquiry } from '../../../../entities/inquiry.entity';
import { SupportRepository } from './infrastructure/support.repository';
import * as strategies from '../../../../common/guards/strategies';
import { SupportController } from './api/support.controller';
import { SupportService } from './core/support.service';
import { AuthModule } from '../../../base/auth/auth.module';
import { User } from '../../../../entities/user.entity';
import { ToolModule } from '../../../utils/tool/tool.module';
import { UserModule } from '../../../base/user/user.module';
import { Release } from '../../../../entities/release.entity';
import { AlertSettings } from '../../../../entities/alertSettings.entity';
import { Device } from '../../../../entities/device.entity';
import { AppVersions } from '../../../../entities/appVersions.entity';
import { SeenNotice } from '../../../../entities/seenNotice.entity';
import { SeenRelease } from '../../../../entities/seenRelease.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      Notice,
      Inquiry,
      Release,
      AlertSettings,
      Device,
      AppVersions,
      SeenNotice,
      SeenRelease,
    ]),
    ToolModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [SupportController],
  providers: [
    SupportService,
    { provide: 'ISupportRepository', useClass: SupportRepository },
    strategies.JwtStrategy,
  ],
  exports: [SupportService, { provide: 'ISupportRepository', useClass: SupportRepository }],
})
export class SupportModule {}
