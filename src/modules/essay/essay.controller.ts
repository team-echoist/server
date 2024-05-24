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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EssayService } from './essay.service';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { OptionalBoolPipe } from '../../common/pipes/optionalBool.pipe';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';
import { EssaysResDto } from './dto/response/essaysRes.dto';
import { ThumbnailReqDto } from './dto/request/ThumbnailReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';
import { RecommendEssaysResDto } from './dto/response/recommendEssaysRes.dto';

@ApiTags('Essay')
@UseGuards(AuthGuard('jwt'))
@Controller('essays')
export class EssayController {
  constructor(private readonly essayService: EssayService) {}

  @Post()
  @ApiOperation({
    summary: '에세이 작성',
    description: '모니터링 유저의 경우 발행 및 링크드아웃시 리뷰 대기',
  })
  @ApiResponse({ status: 201, type: EssayResDto })
  @ApiBody({ type: CreateEssayReqDto })
  async saveEssay(@Req() req: ExpressRequest, @Body() createEssayDto: CreateEssayReqDto) {
    return this.essayService.saveEssay(req.user, req.device, createEssayDto);
  }

  @Put(':essayId')
  @ApiOperation({ summary: '에세이 업데이트' })
  @ApiResponse({ status: 200, type: EssayResDto })
  @ApiBody({ type: UpdateEssayReqDto })
  async updateEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() updateEssayDto: UpdateEssayReqDto,
  ) {
    return this.essayService.updateEssay(req.user, essayId, updateEssayDto);
  }

  @Get()
  @ApiOperation({ summary: '본인 에세이 조회' })
  @ApiResponse({ status: 200, type: EssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('published', OptionalBoolPipe) published: boolean,
    @Query('categoryId', OptionalParseIntPipe) categoryId: number,
  ) {
    // todo 일반, 프리미엄 구독자 구별 기능
    return this.essayService.getMyEssay(req.user.id, published, categoryId, page, limit);
  }

  @Delete(':essayId')
  @ApiOperation({ summary: '에세이 삭제' })
  @ApiResponse({ status: 200 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.deleteEssay(req.user.id, essayId);
  }

  @Post('images')
  @ApiOperation({ summary: '썸네일 업로드' })
  @ApiResponse({ status: 201, type: ThumbnailResDto })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({ type: ThumbnailReqDto })
  async saveThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Body('essayId', OptionalParseIntPipe) essayId?: number,
  ) {
    return this.essayService.saveThumbnailImage(file, essayId);
  }

  @Get('recommend')
  @ApiOperation({ summary: '랜덤 추천 에세이' })
  @ApiResponse({ status: 200, type: [RecommendEssaysResDto] })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommendEssays(@Query('limit', new PagingParseIntPipe(10)) limit: number) {
    return this.essayService.getRecommendEssays(limit);
  }
}
