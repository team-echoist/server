import { Controller, UseGuards } from '@nestjs/common';
import { GuleroquisService } from './guleroquis.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class GuleroquisController {
  constructor(private readonly guleroquisService: GuleroquisService) {}
}
