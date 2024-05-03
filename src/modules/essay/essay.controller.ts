import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EssayService } from './essay.service';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { OptionalBoolPipe } from '../../common/pipes/optionalBool.pipe';
import { CreateEssayReqDto } from './dto/createEssayReq.dto';
import { EssayResDto } from './dto/essayRes.dto';
import { UpdateEssayReqDto } from './dto/updateEssayReq.dto';
import { EssayListResDto } from './dto/essayListRes.dto';

@ApiTags('Essay')
@UseGuards(AuthGuard('jwt'))
@Controller('essay')
export class EssayController {
  constructor(private readonly essayService: EssayService) {}

  @Post()
  @ApiOperation({ summary: '에세이 작성', description: '블랙 유저의 경우 리뷰 대기' })
  @ApiBody({ type: CreateEssayReqDto })
  @ApiResponse({ status: 201, type: EssayResDto })
  async createEssay(@Req() req: ExpressRequest, @Body() createEssayDto: CreateEssayReqDto) {
    return await this.essayService.createEssay(req.user, req.device, createEssayDto);
  }

  @Put(':essayId')
  @ApiOperation({ summary: '에세이 업데이트' })
  @ApiBody({ type: UpdateEssayReqDto })
  @ApiResponse({ status: 200, type: EssayResDto })
  async updateEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() updateEssayDto: UpdateEssayReqDto,
  ) {
    return await this.essayService.updateEssay(req.user, essayId, updateEssayDto);
  }

  @Get()
  @ApiOperation({ summary: '본인 에세이 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiResponse({ status: 200, type: EssayListResDto })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('published', OptionalBoolPipe) published: boolean,
    @Query('categoryId', OptionalParseIntPipe) categoryId: number,
  ) {
    return await this.essayService.getMyEssay(req.user.id, published, categoryId, page, limit);
  }

  @Delete(':essayId')
  @ApiOperation({ summary: '에세이 삭제' })
  @ApiResponse({ status: 204 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    await this.essayService.deleteEssay(req.user.id, essayId);
    return { message: 'Essay deleted successfully.' };
  }
}
