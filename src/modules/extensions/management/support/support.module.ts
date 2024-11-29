import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SupportController } from './api/support.controller';
import { SupportService } from './core/support.service';
import { SupportRepository } from './infrastructure/support.repository';
import * as strategies from '../../../../common/guards/strategies';
import { AlertSettings } from '../../../../entities/alertSettings.entity';
import { AppVersions } from '../../../../entities/appVersions.entity';
import { Device } from '../../../../entities/device.entity';
import { Inquiry } from '../../../../entities/inquiry.entity';
import { Notice } from '../../../../entities/notice.entity';
import { Release } from '../../../../entities/release.entity';
import { SeenNotice } from '../../../../entities/seenNotice.entity';
import { SeenRelease } from '../../../../entities/seenRelease.entity';
import { User } from '../../../../entities/user.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

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
