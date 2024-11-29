import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeulroquisService } from './core/geulroquis.service';
import { GeulroquisRepository } from './infrastructure/geulroquis.repository';
import { Geulroquis } from '../../../../entities/geulroguis.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Geulroquis]),
    ToolModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [],
  providers: [
    GeulroquisService,
    { provide: 'IGeulroquisRepository', useClass: GeulroquisRepository },
  ],
  exports: [
    GeulroquisService,
    { provide: 'IGeulroquisRepository', useClass: GeulroquisRepository },
  ],
})
export class GeulroquisModule {}
