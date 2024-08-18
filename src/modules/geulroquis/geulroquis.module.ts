import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geulroquis } from '../../entities/geulroguis.entity';
import { GeulroquisController } from './geulroquis.controller';
import { GeulroquisService } from './geulroquis.service';
import { GeulroquisRepository } from './geulroquis.repository';
import { UtilsModule } from '../utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Geulroquis]),
    UtilsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [GeulroquisController],
  providers: [GeulroquisService, GeulroquisRepository],
  exports: [GeulroquisService],
})
export class GeulroquisModule {}
