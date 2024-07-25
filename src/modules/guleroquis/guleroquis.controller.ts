import { Controller } from '@nestjs/common';
import { GuleroquisService } from './guleroquis.service';

@Controller()
export class GuleroquisController {
  constructor(private readonly guleroquisService: GuleroquisService) {}
}
