import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { EssayService } from './essay.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Essay')
@Controller('api/essay')
export class EssayController {
  constructor(private readonly essayService: EssayService) {}

  @ApiOperation({ summary: 'test' })
  @Get('test')
  @UseGuards(AuthGuard('jwt'))
  async test() {
    return true;
  }
}
