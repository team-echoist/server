import { Controller, UseGuards } from '@nestjs/common';
import { GeulroquisService } from './geulroquis.service';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class GeulroquisController {
  constructor(private readonly geulroquisService: GeulroquisService) {}
}
