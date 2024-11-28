import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geulroquis } from '../../../../entities/geulroguis.entity';
import { GeulroquisController } from './api/geulroquis.controller';
import { GeulroquisService } from './core/geulroquis.service';
import { GeulroquisRepository } from './infrastructure/geulroquis.repository';
import { ToolModule } from '../../../utils/tool/tool.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Geulroquis]),
    ToolModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [GeulroquisController],
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
