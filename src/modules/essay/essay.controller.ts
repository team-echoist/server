import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { EssaysSchemaDto } from './dto/schema/essaysSchema.dto';
import { ThumbnailReqDto } from './dto/request/ThumbnailReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';
import { CategoriesResDto } from '../category/dto/response/categoriesRes.dto';
import { PublicEssaysSchemaDto } from './dto/schema/publicEssaysSchema.dto';
import { CategoryNameDto } from '../category/dto/repuest/categoryName.dto';
import { SentenceEssaySchemaDto } from './dto/schema/sentenceEssaySchema.dto';

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
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('published', OptionalBoolPipe) published: boolean,
    @Query('categoryId', OptionalParseIntPipe) categoryId: number,
  ) {
    // todo 일반, 프리미엄 구독자 구별 기능
    return this.essayService.getMyEssays(req.user.id, published, categoryId, limit);
  }

  @Delete(':essayId')
  @ApiOperation({ summary: '에세이 삭제' })
  @ApiResponse({ status: 200 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.deleteEssay(req.user.id, essayId);
  }

  @Post('images')
  @ApiOperation({
    summary: '썸네일 업로드',
    description:
      '작성 도중에 이미 이미지를 한 번 업로드 했다면, 기존 이미지에 대한 삭제요청이 필요합니다.',
  })
  @ApiResponse({ status: 201, type: ThumbnailResDto })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({ type: ThumbnailReqDto })
  async saveThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Body('essayId', OptionalParseIntPipe) essayId?: number,
  ) {
    return this.essayService.saveThumbnail(file, essayId);
  }

  @Delete('images/:essayId')
  @ApiOperation({ summary: '썸네일 삭제' })
  @ApiResponse({ status: 204 })
  async deleteThumbnail(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.deleteThumbnail(essayId);
  }

  @Get('recommend')
  @ApiOperation({ summary: '랜덤 추천 에세이 리스트' })
  @ApiResponse({ status: 200, type: PublicEssaysSchemaDto })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommendEssays(@Query('limit', new PagingParseIntPipe(10)) limit: number) {
    return this.essayService.getRecommendEssays(limit);
  }

  @Get('followings')
  @ApiOperation({ summary: '팔로우 중인 유저들의 최신 에세이 리스트' })
  @ApiResponse({ status: 200, type: PublicEssaysSchemaDto })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowingsEssays(
    @Req() req: ExpressRequest,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getFollowingsEssays(req.user.id, limit);
  }

  @Get('categories')
  @ApiOperation({ summary: '본인 카테고리 리스트' })
  @ApiResponse({ status: 200, type: CategoriesResDto })
  async getMyCategories(@Req() req: ExpressRequest) {
    return this.essayService.categories(req.user.id);
  }

  @Get('categories/:userId')
  @ApiOperation({ summary: '타겟 유저 카테고리 리스트' })
  @ApiResponse({ status: 200, type: CategoriesResDto })
  async getUserCategories(@Param('userId', ParseIntPipe) userId: number) {
    return this.essayService.categories(userId);
  }

  @Post('categories')
  @ApiOperation({ summary: '카테고리 생성' })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CategoryNameDto })
  async saveCategory(@Req() req: ExpressRequest, @Body() data: CategoryNameDto) {
    return this.essayService.saveCategory(req.user.id, data.name);
  }

  @Put('categories/:categoryId')
  @ApiOperation({ summary: '카테고리 이름 변경' })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: CategoryNameDto })
  async updateCategory(
    @Req() req: ExpressRequest,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() data: CategoryNameDto,
  ) {
    return this.essayService.updateCategory(req.user.id, categoryId, data.name);
  }

  @Delete('categories/:categoryId')
  @ApiOperation({ summary: '카테고리 삭제' })
  @ApiResponse({ status: 204 })
  async deleteCategory(
    @Req() req: ExpressRequest,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.essayService.deleteCategory(req.user.id, categoryId);
  }

  @Get('sentence')
  @ApiOperation({ summary: '한 문장 에세이 조회' })
  @ApiResponse({ status: 200, type: SentenceEssaySchemaDto })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async oneSentenceEssays(
    @Query('type', new DefaultValuePipe('first')) type: 'first' | 'last' = 'first',
    @Query('limit', new PagingParseIntPipe(6)) limit: number,
  ) {
    return await this.essayService.getSentenceEssays(type, limit);
  }

  @Get(':essayId')
  @ApiOperation({ summary: '에세이 상세조회' })
  @ApiResponse({ status: 200, type: EssayResDto })
  async getEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.getEssay(req.user.id, essayId);
  }
}
