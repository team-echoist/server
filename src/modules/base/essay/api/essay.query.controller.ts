import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { OptionalParseIntPipe } from '../../../../common/pipes/optionalParseInt.pipe';
import { PageTypeEnumPipe } from '../../../../common/pipes/PageTypeEnum.pipe';
import { PagingParseIntPipe } from '../../../../common/pipes/pagingParseInt.pipe';
import { PageType } from '../../../../common/types/enum.types';
import { EssayService } from '../core/essay.service';
import { EssayWithAnotherEssayResDto } from '../dto/response/essayWithAnotherEssayRes.dto';
import { PublicEssaysResDto } from '../dto/response/publicEssaysRes.dto';
import { SentenceEssaysResDto } from '../dto/response/sentenceEssaysRes.dto';
import { SummaryEssaysResDto } from '../dto/response/SummaryEssaysRes.dto';

@ApiTags('Essay-query')
@UseGuards(JwtAuthGuard)
@Controller('essays')
export class EssayQueryController {
  constructor(private readonly essayService: EssayService) {}

  @Get()
  @ApiOperation({
    summary: '자신의 에세이 리스트 조회',
    description: `
  사용자 본인이 작성한 에세이 목록을 조회합니다. 다양한 쿼리 파라미터를 사용하여 에세이 목록을 필터링할 수 있습니다.

  **쿼리 파라미터:**
  - \`page\` (number, optional): 조회할 페이지를 지정합니다. 기본값은 1입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 10입니다.
  - \`pageType\`: '나만의 글'에선 'private', '발행한 글'에선 'public' 를 사용합니다. 'story'인 경우 자신의 에세이만 조회할 수 있습니다.
  - \`storyId\`: (number, optional): \`pageType.STORY\`인 경우 제공.

  **동작 과정:**
  1. 사용자가 작성한 에세이를 조회합니다.
  2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  3. 조회된 에세이 목록과 전체 에세이 수를 반환합니다.
  4. 올바른 story를 조회했다면 스토리 이름이 추가됩니다. 
  `,
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'pageType', required: true })
  @ApiQuery({ name: 'storyId', required: false })
  @ApiResponse({ status: 200, type: SummaryEssaysResDto })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('pageType', PageTypeEnumPipe) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
  ) {
    return this.essayService.getMyEssays(req.user.id, pageType, page, limit, storyId);
  }

  @Get('author/:userId')
  @ApiOperation({
    summary: '다른 사용자의 에세이 리스트 조회',
    description: `
  제공받은 경로 파라미터 식별자가 작성한 에세이 목록을 조회합니다.

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

  @Get('recommend')
  @ApiOperation({
    summary: '랜덤 추천 에세이 리스트',
    description: `
  랜덤으로 추천된 에세이 목록을 조회합니다. 요청자가 최신에 읽은 에세이, 작성자들의 평판, 생성일 등 여러 가중치가 적용됩니다.

  **쿼리 파라미터:**
  - \`limit\` (number, optional): 조회할 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 공개 상태의 에세이들 중 가중치를 적용해 랜덤으로 조회합니다.
  2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  3. 에세이 목록을 반환합니다.

  **주의 사항:**
  - 에세이의 상태가 'PRIVATE', 'BURIAL' 인 경우 조회되지 않습니다.
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
  - 에세이의 상태가 'PRIVATE', 'LINKEDOUT', 'BURIAL' 인 경우 조회되지 않습니다.
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
  한 문장 기능에 사용되는 에세이를 조회합니다. 'type' 파라미터를 통해 에세이의 첫 문장 또는 마지막 문장을 선택할 수 있습니다.

  **쿼리 파라미터:**
  - \`type\` (string, required): \`first\` 또는 \`last\` 를 사용하여 에세이의 첫 문장 또는 마지막 문장을 선택합니다. 기본값은 \`first\`입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 6입니다.

  **동작 과정:**
  1. 지정된 'type' 파라미터에 따라 에세이의 첫 문장 또는 마지막 문장을 추출합니다.
  2. 지정된 'limit' 파라미터에 따라 에세이 목록을 제한합니다.
  3. 조회된 에세이 목록을 반환합니다.

  **주의 사항:**
  - 'type' 파라미터는 'first' 또는 'last' 값만 허용됩니다.
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
  키워드를 기반으로 에세이를 검색합니다. 각 페이지에 알맞은 타입을 제공해야합니다.
  키워드와 제목, 내용의 유사도, 작성일 등을 기준으로 가중치가 적용된 에세이 리스트를 반환합니다.
  
  **쿼리 파라미터:**
  - \`pageType\`: 페이지 타입. 나만의글=private, 커뮤니티=public (필수)
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
  @ApiQuery({ name: 'keyword', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    type: SummaryEssaysResDto,
  })
  async searchEssays(
    @Req() req: ExpressRequest,
    @Query('pageType', PageTypeEnumPipe) pageType: PageType,
    @Query('keyword') keyword: string,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    if (pageType !== PageType.ANY)
      return this.essayService.searchEssays(pageType, keyword, page, limit, req.user.id);
    return;
  }

  @Get(':essayId')
  @ApiOperation({
    summary: '에세이 상세조회',
    description: `
  경로 파라미터로 제공받은 에세이(식별자)의 상세 정보를 조회합니다. 페이지 타입에 따라 \`다른 글\` 또는 \`이전 글\` 을 같이 조회합니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 조회할 에세이의 ID
  
  **쿼리 파라미터:**
  - \`pageType\` (required): 응답객체의 \`anotherEssays\` 필드의 값을 결정합니다. \`private\`, \`public\`, \`story\`, \`recommend\`, \`burial\`를 사용할 수 있으며 각각 저장한 글, 발행한 글, 타겟 스토리, 땅에묻은 글의 \`이전 글\`. 그리고 추천 에세이(한 문장)의 \`다른 글\`에 사용됩니다.
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

  `,
  })
  @ApiResponse({ status: 200, type: EssayWithAnotherEssayResDto })
  async getEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Query('pageType', PageTypeEnumPipe) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId?: number,
  ) {
    return this.essayService.getEssay(req, essayId, pageType, storyId);
  }

  @Get('next/:essayId')
  @ApiOperation({
    summary: '다음 에세이 상세조회',
    description: `
  에세이 상세조회 페이지의 \`다음\` 버튼 기능에 사용됩니다.
  현재 에세이에서 다음 에세이의 상세 정보를 조회합니다. 각 에세이의 '다른 글' 또는 '이전 글' 을 같이 조회합니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 현재 에세이의 아이디
  
  **쿼리 파라미터:**
  - \`pageType\` (required): 응답객체의 \`anotherEssays\` 필드의 값을 결정합니다. \`private\`, \`public\`, \`story\` 를 사용할 수 있으며 각각 저장한 글, 발행한 글, 타겟 스토리 의 \`이전 글\`. 그리고 추천 에세이의 \`다른 글\`에 사용됩니다.
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
  - \'pageType\'에 \`recommend\`를 사용할 시 예외 처리 됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: EssayWithAnotherEssayResDto })
  async getNextEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Query('pageType', PageTypeEnumPipe) pageType: PageType,
    @Query('storyId', OptionalParseIntPipe) storyId?: number,
  ) {
    return this.essayService.getNextEssay(req, essayId, pageType, storyId);
  }
}
