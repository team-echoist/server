import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { CreateEssayReqDto } from './dto/request/createEssayReq.dto';
import { EssayResDto } from './dto/response/essayRes.dto';
import { UpdateEssayReqDto } from './dto/request/updateEssayReq.dto';
import { SummaryEssaysResDto } from './dto/response/SummaryEssaysRes.dto';
import { ThumbnailReqDto } from './dto/request/ThumbnailReq.dto';
import { ThumbnailResDto } from './dto/response/ThumbnailRes.dto';
import { PublicEssaysResDto } from './dto/response/publicEssaysRes.dto';
import { SentenceEssaysResDto } from './dto/response/sentenceEssaysRes.dto';
import { EssayWithAnotherEssayResDto } from './dto/response/essayWithAnotherEssayRes.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';
import { PageType } from '../../common/types/enum.types';

@ApiTags('Essay')
@UseGuards(JwtAuthGuard)
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
  - 에세이가 발행(Published), 링크드아웃(LinkedOut) 혹은 땅에묻기(buried) 상태일 때 리뷰 대기 상태로 전환됩니다.
  - 리뷰 대기 상태에서는 관리자가 에세이를 검토한 후에만 발행됩니다.

  **주의 사항:**
  - 요청 바디의 모든 필드 키는 필수이지만 특정 필드는 값이 비어있어도 됩니다(스키마 참고).
  - buried 요청의 경우 좌표 데이터가 필수로 필요합니다.
  `,
  })
  @ApiResponse({ status: 201, type: EssayResDto })
  @ApiBody({ type: CreateEssayReqDto })
  async saveEssay(@Req() req: ExpressRequest, @Body() createEssayDto: CreateEssayReqDto) {
    return this.essayService.saveEssay(req.user, req.device, createEssayDto);
  }

  @Put(':essayId')
  @ApiOperation({
    summary: '에세이 업데이트',
    description: `
  기존에 작성한 에세이를 업데이트합니다. 요청자는 에세이의 작성자여야 하며, 모니터링된 사용자일 경우 에세이 상태 변경에 제약이 있을 수 있습니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 업데이트할 에세이의 ID

  **요청 바디:**
  - \`title\` (string): 에세이 제목
  - \`content\` (string): 에세이 내용
  - \`tags\` (string[]): 태그 목록
  - \`storyId\` (number): 스토리 ID
  - \`status\` (string): 에세이 상태 (예: published, private, linkedout)
  - \`location\` (string): 장소 이름

  **동작 과정:**
  1. 요청자의 ID로 사용자 엔티티를 조회합니다.
  2. 요청된 스토리 ID와 태그 목록으로 스토리와 태그를 조회합니다.
  3. 에세이 ID로 에세이를 조회하고, 에세이가 현재 검토 중인지 확인합니다.
  4. 모니터링된 사용자이고 에세이 상태가 PRIVATE이 아닌 경우, 검토 요청을 생성합니다.
  5. 에세이 데이터를 업데이트하고, 태그 경험치를 추가합니다.
  6. 업데이트된 에세이를 반환합니다.

  **주의 사항:**
  - 요청자는 에세이의 작성자여야 합니다.
  - 작성시 등록한 좌표는 변경할 수 없습니다.
  - 에세이가 검토 중인 경우, PRIVATE 상태가 아니면 업데이트가 거부됩니다.
  - 모니터링된 사용자는 PRIVATE 상태 외의 변경에 제약이 있을 수 있습니다.
  `,
  })
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
    summary: '본인 에세이 리스트 조회',
    description: `
  사용자 본인이 작성한 에세이 목록을 조회하는 데 사용됩니다. 다양한 쿼리 파라미터를 사용하여 에세이 목록을 필터링할 수 있습니다.

  **쿼리 파라미터:**
  - \`page\` (number, optional): 조회할 페이지를 지정합니다. 기본값은 1입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 10입니다.
  - \`pageType\`: '나만의 글'에선 'private', '발행한 글'에선 'public' 를 사용합니다.
  - \`storyId\`: (number, optional): 특정 스토리에 속한 에세이만 조회

  **동작 과정:**
  1. 사용자가 작성한 에세이를 조회합니다.
  2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  3. 조회된 에세이 목록과 전체 에세이 수를 반환합니다.
  
  **주의 사항:**
  `,
  })
  @ApiResponse({ status: 200, type: SummaryEssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'storyId', required: false })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('pageType', new ParseEnumPipe(PageType)) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId?: number,
  ) {
    return this.essayService.getMyEssays(req.user.id, pageType, page, limit, storyId);
  }

  @Get('author/:userId')
  @ApiOperation({
    summary: '타겟 유저의 에세이 리스트 조회',
    description: `
  특정 사용자가 작성한 에세이 목록을 조회합니다.

  **쿼리 파라미터:**
  - \`storyId\`: 특정 스토리에 속한 에세이만 조회 (선택 사항)
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 조회할 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 주어진 사용자 ID를 기반으로 해당 사용자가 작성한 에세이를 조회합니다.
  2. 조회된 에세이에서 상태가 'LINKEDOUT' 또는 'PRIVATE'인 에세이는 제외합니다.
  3. 스토리 ID가 제공된 경우, 해당 스토리에 속한 에세이만 필터링합니다.
  4. 스토리 ID가 제공되지 않은 경우, 모든 스토리와 상관없이 퍼블릭 에세이를 조회합니다.
  5. 페이지네이션을 적용하여 에세이 목록을 반환합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 필요합니다.
  - 스토리 ID가 제공되지 않으면 모든 퍼블릭 에세이를 조회합니다.
  `,
  })
  @ApiResponse({ status: 200, type: SummaryEssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'storyId', required: false })
  async getTargetUserEssays(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
  ) {
    return this.essayService.getTargetUserEssays(userId, storyId, page, limit);
  }

  @Post('images')
  @ApiOperation({
    summary: '썸네일 업로드',
    description: `
  에세이 작성 도중 썸네일 이미지를 업로드합니다. 
  작성 도중에 이미 이미지를 한 번 업로드 했다면, 기존 이미지에 대한 삭제요청이 필요합니다(@Delete('images/:essayId')).

  **쿼리 파라미터:**
  - \`essayId\` (선택): 썸네일을 업로드할 에세이의 ID. 이 값이 주어지지 않으면 새로운 이미지를 업로드합니다.

  **동작 과정:**
  1. \`essayId\`가 제공되면 해당 에세이의 썸네일을 업데이트합니다.
  2. 새로운 이미지 파일을 S3에 업로드합니다.
  3. 업로드된 이미지의 URL을 반환합니다.

  **주의 사항:**
  - 에세이 ID가 제공되지 않으면 새로운 UUID를 생성하여 이미지를 저장합니다.
  - 기존 썸네일이 있는 경우, 새로운 썸네일 업로드 전에 기존 썸네일을 삭제해야 합니다.
  `,
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
  @ApiOperation({
    summary: '썸네일 삭제',
    description: `
  지정된 에세이의 썸네일 이미지를 삭제합니다.

  **경로 파라미터:**
  - \`essayId\`: 썸네일을 삭제할 에세이의 ID.

  **동작 과정:**
  1. 에세이를 ID로 조회하여 썸네일이 있는지 확인합니다.
  2. 썸네일이 존재하면 S3에서 이미지를 삭제합니다.
  3. 에세이의 썸네일 필드를 null로 업데이트합니다.
  4. 썸네일 삭제 성공 메시지를 반환합니다.

  **주의 사항:**
  - 썸네일이 없는 에세이에 대해 삭제 요청을 하면, 404 Not Found 에러를 반환합니다.
  `,
  })
  @ApiResponse({ status: 204 })
  async deleteThumbnail(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.deleteThumbnail(essayId);
  }

  @Get('recommend')
  @ApiOperation({
    summary: '랜덤 추천 에세이 리스트',
    description: `
  랜덤으로 추천된 에세이 목록을 조회합니다.

  **쿼리 파라미터:**
  - \`limit\` (number, optional): 조회할 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 공개 상태의 에세이들 중 가중치를 적용해 랜덤으로 조회합니다.
  2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  3. 에세이 목록을 반환합니다.

  **주의 사항:**
  - 에세이의 상태가 'PRIVATE', 'BURY' 인 경우 조회되지 않습니다.
  `,
  })
  @ApiResponse({ status: 200, type: PublicEssaysResDto })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommendEssays(
    @Req() req: ExpressRequest,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getRecommendEssays(req.user.id, limit);
  }

  @Get('followings')
  @ApiOperation({
    summary: '팔로우 중인 유저들의 최신 에세이 리스트',
    description: `
  사용자가 팔로우하고 있는 유저들이 작성한 최신 에세이 목록을 조회합니다.

  **쿼리 파라미터:**
  - \`page\` (number, optional): 조회할 페이지 (기본값: 1)
  - \`limit\` (number, optional): 조회할 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 사용자가 팔로우하고 있는 유저 목록을 조회합니다.
  2. 팔로우 중인 유저들이 작성한 최신 에세이 목록을 조회합니다.
  3. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  4. 에세이 목록을 반환합니다.

  **주의 사항:**
  - 팔로우 중인 유저가 없을 경우 빈 배열을 반환합니다.
  - 에세이의 상태가 'PRIVATE', 'LINKEDOUT', 'BURY' 인 경우 조회되지 않습니다.
  `,
  })
  @ApiResponse({ status: 200, type: PublicEssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowingsEssays(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getFollowingsEssays(req.user.id, page, limit);
  }

  @Get('sentence')
  @ApiOperation({
    summary: '한 문장 에세이 조회',
    description: `
  한 문장 에세이를 조회합니다. 'type' 파라미터를 통해 에세이의 첫 문장 또는 마지막 문장을 선택할 수 있습니다.

  **쿼리 파라미터:**
  - \`type\` (string, required): 'first' 또는 'last' 값을 사용하여 에세이의 첫 문장 또는 마지막 문장을 선택합니다. 기본값은 'first'입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 6입니다.

  **동작 과정:**
  1. 지정된 'type' 파라미터에 따라 에세이의 첫 문장 또는 마지막 문장을 추출합니다.
  2. 지정된 'limit' 파라미터에 따라 에세이 목록을 제한합니다.
  3. 조회된 에세이 목록을 반환합니다.

  **주의 사항:**
  - 'type' 파라미터는 'first' 또는 'last' 값만 허용됩니다.
  - 'limit' 파라미터는 선택 사항이며 기본값은 6입니다.
  `,
  })
  @ApiResponse({ status: 200, type: SentenceEssaysResDto })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async oneSentenceEssays(
    @Req() req: ExpressRequest,
    @Query('type', new DefaultValuePipe('first')) type: 'first' | 'last' = 'first',
    @Query('limit', new PagingParseIntPipe(6)) limit: number,
  ) {
    return await this.essayService.getSentenceEssays(req.user.id, type, limit);
  }

  @Get('recent')
  @ApiOperation({
    summary: '최근 조회한 에세이 목록',
    description: `
  사용자가 최근에 조회한 에세이 목록을 가져옵니다.
    
  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 보여줄 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 사용자의 ID를 기반으로 최근에 조회한 에세이 목록을 조회합니다.
  2. 조회된 에세이 목록과 총 개수를 반환합니다.
    
  **주의 사항:**
  - 로그인한 사용자의 최근 조회 기록을 가져옵니다.
  `,
  })
  @ApiResponse({ status: 200, type: SummaryEssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentViewedEssays(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getRecentViewedEssays(req.user.id, page, limit);
  }

  @Get('search')
  @ApiOperation({
    summary: '에세이 검색',
    description: `
  키워드를 기반으로 에세이를 검색합니다. 
  
  **쿼리 파라미터:**
  - \`pageType\`: 페이지 타입. 나만의페이지=private, 커뮤니티=public (필수)
  - \`keyword\`: 검색할 키워드(필수)
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 보여줄 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 주어진 키워드를 제목 또는 내용에서 검색합니다.
  2. 검색된 결과에서 페이징 처리를 합니다.
  3. 결과는 제목 또는 내용에 키워드가 포함된 에세이의 슬라이스된 내용을 반환합니다.

  **주의 사항:**
  - 검색 키워드는 URL 인코딩된 문자열이어야 합니다.
  - 응답에는 제목 또는 본문에 키워드가 포함된 에세이만 포함됩니다.
  `,
  })
  @ApiQuery({
    name: 'pageType',
    required: false,
    description: '임시로 타입검사를 제외중입니다. 추후엔 열겨형타입검증이 적용됩니다.',
  })
  @ApiQuery({ name: 'keyword', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    type: SummaryEssaysResDto,
  })
  async searchEssays(
    // todo 다음 안드로이드 릴리즈까지 한시적 허용
    // @Query('pageType', new ParseEnumPipe(PageType)) pageType: PageType,
    @Query('pageType') pageType: string,
    @Query('keyword') keyword: string,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    if (pageType !== PageType.ANY)
      return this.essayService.searchEssays(pageType, keyword, page, limit);
    return;
  }

  @Get(':essayId')
  @ApiOperation({
    summary: '에세이 상세조회',
    description: `
  특정 에세이의 상세 정보를 조회합니다. 각 에세이의 '다른 글' 또는 '이전 글' 을 같이 조회합니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 조회할 에세이의 ID
  
  **쿼리 파라미터:**
  - \`pageType\` (required): 응답객체의 'anotherEssays' 프로퍼티의 값을 결정합니다. \`private\`, \`public\`, \`story\`, \`recommend\`, \`burial\`를 사용할 수 있으며 각각 저장한 글, 발행한 글, 타겟 스토리, 땅에묻은 글의 \`이전 글\`. 그리고 추천 에세이의 \`다른 글\`에 사용됩니다.
  - \`storyId\` (optional): 선택적 쿼리로, 만약 \`pageType\` 이 \`story\`라면 해당 스토리의 아이디를 쿼리로 추가해야합니다.
  
  **각 페이지 타입에 대한 '이전 글' 동작:**
  '이전 글'이란 현재 상세조회한 글의 직전 글을 뜻합니다.
  - \`private\` 자신의 글이 아닌 경우 예외를 던집니다. '나만의 글' 페이지에 포함된 이전 글을 같이 반환합니다.
  - \`public\` 자신 혹은 타인의 '발행한 글' 페이지에 포함된 이전 글을 반환합니다.
  - \`story\` 'storyId' 에 해당하는 이전 글을 반환합니다. 만약 자신의 글이 아닌 경우 'private'상태의 글은 제외합니다.
  - \`recommend\` 랜덤 추천 글을 제공합니다.
  - \`burial\` 이전 글 또는 다른 글을 제공하지 않습니다.

  **동작 과정:**
  1. 요청된 에세이 ID로 에세이를 조회합니다.
  2. 요청한 사용자가 에세이의 작성자가 아닌 경우, 에세이 상태가 PRIVATE일 때 조회가 거부됩니다.
  3. 조회에 성공한 경우 조회수를 증가시킵니다.
  4. 요청된 페이지 타입에 따라 다른 에세이 목록을 조회합니다.
  5. 조회된 에세이와 추가 에세이 목록을 반환합니다.

  **주의 사항:**
  - 에세이 ID는 유효한 숫자여야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: EssayWithAnotherEssayResDto })
  async getEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Query('pageType', new ParseEnumPipe(PageType)) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId?: number,
  ) {
    return this.essayService.getEssay(req, essayId, pageType, storyId);
  }

  @Get('next/:essayId')
  @ApiOperation({
    summary: '다음 에세이 상세조회',
    description: `
  현재 에세이에서 다음 에세이의 상세 정보를 조회합니다. 각 에세이의 '다른 글' 또는 '이전 글' 을 같이 조회합니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 현재 에세이의 아이디
  
  **쿼리 파라미터:**
  - \`pageType\` (required): 응답객체의 'anotherEssays' 프로퍼티의 값을 결정합니다. \`private\`, \`public\`, \`story\` 를 사용할 수 있으며 각각 저장한 글, 발행한 글, 타겟 스토리 의 \`이전 글\`. 그리고 추천 에세이의 \`다른 글\`에 사용됩니다.
  - \`storyId\` (optional): 선택적 쿼리로, 만약 \`pageType\` 이 \`story\`면 해당 스토리의 아이디를 쿼리로 추가해야합니다.
  
  **각 페이지 타입에 대한 동작:**
  페이지 타입에 따라 '이전 글'은 '에세이 상세조회'와 동일하게 동작합니다.
  페이지 타입에 따라 '현재 글' 의 '다음 글'을 조회합니다.
  - \`private\` 자신의 글이 아닌 경우 예외를 던집니다. '나만의 글' 페이지에 포함된 다음 글을 조회합니다.
  - \`public\` 자신 혹은 타인의 '발행한 글' 페이지에 포함된 다음 글을 반환합니다.
  - \`story\` 'storyId' 에 해당하는 다음 글을 반환합니다. 만약 자신의 글이 아닌 경우 'private'상태의 글은 제외합니다.

  **동작 과정:**
  1. 요청된 에세이 ID의 다음 에세이를 조회합니다.
  2. 요청한 사용자가 에세이의 작성자가 아닌 경우, 에세이 상태가 PRIVATE일 때 조회가 거부됩니다.
  3. 조회에 성공한 경우 조회수를 증가시킵니다.
  4. 요청된 페이지 타입에 따라 다른 에세이 목록을 조회합니다.
  5. 조회된 에세이와 추가 에세이 목록을 반환합니다.

  **주의 사항:**
  - '다음 글'이 없을 경우 \`null\`을 반환합니다.
  - \'pageType\'에 \`recommend\`를 사용할 시 예외처리됩니다.
  - 에세이 ID는 유효한 숫자여야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: EssayWithAnotherEssayResDto })
  async getNextEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Query('pageType', new ParseEnumPipe(PageType)) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId?: number,
  ) {
    return this.essayService.getNextEssay(req, essayId, pageType, storyId);
  }

  @Delete(':essayId')
  @ApiOperation({
    summary: '에세이 삭제',
    description: `
  지정된 ID를 가진 에세이를 삭제합니다. 에세이는 논리적으로 삭제되며, 실제 데이터는 유지되지만 삭제된 것으로 표시됩니다.

  **경로 파라미터:**
  - \`essayId\`: 삭제할 에세이의 ID (필수)

  **동작 과정:**
  1. 에세이 ID와 사용자 ID를 기반으로 에세이를 조회합니다.
  2. 에세이가 존재하지 않거나 사용자가 에세이의 작성자가 아닌 경우 오류를 반환합니다.
  3. 에세이를 논리적으로 삭제합니다 (deletedDate 필드를 현재 날짜로 설정).

  **주의 사항:**
  - 사용자는 본인이 작성한 에세이만 삭제할 수 있습니다.
  - 논리 삭제를 통해 실제 데이터는 유지되며, 이후 복구가 가능합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    await this.essayService.deleteEssay(req.user.id, essayId);
  }
}
