import { Controller, UseGuards } from '@nestjs/common';
import { GeulroquisService } from './geulroquis.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class GeulroquisController {
  constructor(private readonly geulroquisService: GeulroquisService) {}
}
