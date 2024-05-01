import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { EssayService } from './essay.service';
import { CreateEssayReqDto } from './dto/createEssayReq.dto';
import { EssayResDto } from './dto/essayRes.dto';
import { UpdateEssayReqDto } from './dto/updateEssayReq.dto';

@ApiTags('Essay')
@Controller('essay')
export class EssayController {
  constructor(private readonly essayService: EssayService) {}

  @Post()
  @ApiOperation({ summary: '에세이 작성', description: '블랙 유저의 경우 리뷰 대기' })
  @ApiBody({ type: CreateEssayReqDto })
  @ApiResponse({ status: 201, type: EssayResDto })
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async createEssay(@Req() req: ExpressRequest, @Body() createEssayDto: CreateEssayReqDto) {
    return await this.essayService.createEssay(req.user, req.device, createEssayDto);
  }

  @Put(':essayId')
  @ApiOperation({ summary: '에세이 업데이트' })
  @ApiBody({ type: UpdateEssayReqDto })
  @ApiResponse({ status: 200, type: EssayResDto })
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async updateEssay(
    @Req() req: ExpressRequest,
    @Param('essayId') essayId: string,
    @Body() updateEssayDto: UpdateEssayReqDto,
  ) {
    return await this.essayService.updateEssay(req.user, essayId, updateEssayDto);
  }
}
