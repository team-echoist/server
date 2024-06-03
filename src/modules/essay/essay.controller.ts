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
import { StoriesResDto } from '../story/dto/response/storiesRes.dto';
import { PublicEssaysSchemaDto } from './dto/schema/publicEssaysSchema.dto';
import { CreateStoryReqDto } from '../story/dto/repuest/createStoryReq.dto';
import { SentenceEssaySchemaDto } from './dto/schema/sentenceEssaySchema.dto';

@ApiTags('Essay')
@UseGuards(AuthGuard('jwt'))
@Controller('essays')
export class EssayController {
  constructor(private readonly essayService: EssayService) {}

  @Post()
  @ApiOperation({
    summary: '에세이 작성',
    description: `
    사용자가 새로운 에세이를 작성하는 데 사용됩니다. 에세이는 다양한 상태를 가질 수 있으며, 모니터링 상태의 사용자는 특정 조건을 만족해야 합니다.
    
    **추가 정보:**
    - 에세이 작성 후, 사용된 태그에 따라 사용자 경험치가 증가합니다.
      - 각 태그는 특정 뱃지와 연관되어 있습니다.
      - 태그가 이미 사용된 경우 경험치가 증가하지 않습니다.
      - 태그가 처음 사용된 경우 경험치가 증가하며, 경험치가 10에 도달하면 레벨업이 가능합니다.

    **모니터링 유저의 경우:**
    - 에세이가 발행(Published)되거나 링크드아웃(LinkedOut) 상태일 때 리뷰 대기 상태로 전환됩니다.
    - 리뷰 대기 상태에서는 관리자가 에세이를 검토한 후에만 발행됩니다.

    **주의 사항:**
    - 요청 바디의 모든 필드 키는 필수이지만 특정 필드는 값이 비어있어도 됩니다(스키마 참고).
    `,
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
  @ApiOperation({
    summary: '본인 에세이 조회',
    description: `
    사용자 본인이 작성한 에세이 목록을 조회하는 데 사용됩니다. 다양한 쿼리 파라미터를 사용하여 에세이 목록을 필터링할 수 있습니다.

    **쿼리 파라미터:**
    - \`limit\`: 조회할 에세이 수 (기본값: 10)
    - \`published\`: 발행 여부 (true 또는 false)
    - \`storyId\`: 특정 스토리에 속한 에세이만 조회

    **동작 과정:**
    1. 사용자가 작성한 에세이를 조회합니다.
    2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
    3. 조회된 에세이 목록과 전체 에세이 수를 반환합니다.
    
    **주의 사항:**
    - 쿼리 파라미터 키는 필수이지만 값이 비어있어도 됩니다.
    `,
  })
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'storyId', required: false })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('published', OptionalBoolPipe) published: boolean,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
  ) {
    return this.essayService.getMyEssays(req.user.id, published, storyId, limit);
  }

  @Delete(':essayId')
  @ApiOperation({ summary: '에세이 삭제' })
  @ApiResponse({ status: 200 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    await this.essayService.deleteEssay(req.user.id, essayId);
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

  @Get('stories')
  @ApiOperation({ summary: '본인 스토리 리스트' })
  @ApiResponse({ status: 200, type: StoriesResDto })
  async getMyStories(@Req() req: ExpressRequest) {
    return this.essayService.getStories(req.user.id);
  }

  @Get('stories/:userId')
  @ApiOperation({ summary: '타겟 유저 스토리 리스트' })
  @ApiResponse({ status: 200, type: StoriesResDto })
  async getUserStories(@Param('userId', ParseIntPipe) userId: number) {
    return this.essayService.getStories(userId);
  }

  @Post('stories')
  @ApiOperation({
    summary: '스토리 생성',
    description:
      '에세이를 미포함해서 스토리를 생성하는 경우에도 body에 essayIds 필드를 빈 배열로 보내주세요.',
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateStoryReqDto })
  async saveStory(@Req() req: ExpressRequest, @Body() data?: CreateStoryReqDto) {
    return this.essayService.saveStory(req.user.id, data);
  }

  @Put('stories/:storyId')
  @ApiOperation({ summary: '스토리 이름 변경' })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: CreateStoryReqDto })
  async updateStory(
    @Req() req: ExpressRequest,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() data: CreateStoryReqDto,
  ) {
    return this.essayService.updateStory(req.user.id, storyId, data.name);
  }

  @Delete('stories/:storyId')
  @ApiOperation({ summary: '스토리 삭제' })
  @ApiResponse({ status: 204 })
  async deleteStory(@Req() req: ExpressRequest, @Param('storyId', ParseIntPipe) storyId: number) {
    return this.essayService.deleteStory(req.user.id, storyId);
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
