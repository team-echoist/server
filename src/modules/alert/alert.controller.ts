import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AlertService } from './alert.service';

@Controller('alerts')
@ApiTags('Alert')
@UseGuards(AuthGuard('jwt'))
export class AlertController {
  constructor(private readonly alertServie: AlertService) {}
}
