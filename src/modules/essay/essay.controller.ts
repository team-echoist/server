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
import { UpdateStoryReqDto } from '../story/dto/repuest/updateStoryReq.dto';
import { EssaysSummarySchemaDto } from './dto/schema/essaysSummarySchema.dto';

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

  **동작 과정:**
  1. 요청자의 ID로 사용자 엔티티를 조회합니다.
  2. 요청된 스토리 ID와 태그 목록으로 스토리와 태그를 조회합니다.
  3. 에세이 ID로 에세이를 조회하고, 에세이가 현재 검토 중인지 확인합니다.
  4. 모니터링된 사용자이고 에세이 상태가 PRIVATE이 아닌 경우, 검토 요청을 생성합니다.
  5. 에세이 데이터를 업데이트하고, 태그 경험치를 추가합니다.
  6. 업데이트된 에세이를 반환합니다.

  **주의 사항:**
  - 요청자는 에세이의 작성자여야 합니다.
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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiQuery({ name: 'storyId', required: false })
  async getMyEssay(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
    @Query('published', OptionalBoolPipe) published: boolean,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
  ) {
    return this.essayService.getMyEssays(req.user.id, published, storyId, page, limit);
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
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
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
  1. 공개 상태의 에세이를 랜덤으로 조회합니다.
  2. 각 에세이의 내용을 일부만 추출하여 반환합니다.
  3. 에세이 목록을 반환합니다.

  **주의 사항:**
  - 에세이의 상태가 'PRIVATE'인 경우 조회되지 않습니다.
  `,
  })
  @ApiResponse({ status: 200, type: PublicEssaysSchemaDto })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommendEssays(@Query('limit', new PagingParseIntPipe(10)) limit: number) {
    return this.essayService.getRecommendEssays(limit);
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
  - 에세이의 상태가 'PRIVATE' 또는 'LINKEDOUT' 인 경우 조회되지 않습니다.
  `,
  })
  @ApiResponse({ status: 200, type: PublicEssaysSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowingsEssays(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getFollowingsEssays(req.user.id, page, limit);
  }

  @Get('stories')
  @ApiOperation({
    summary: '본인 스토리 리스트',
    description: `
  사용자가 작성한 스토리 목록을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 이용하여 해당 사용자가 작성한 모든 스토리를 조회합니다.
  2. 조회된 스토리 목록을 반환합니다.

  **주의 사항:**
  - 반환된 스토리에는 각 스토리에 포함된 에세이의 카운트가 포함됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: StoriesResDto })
  async getMyStories(@Req() req: ExpressRequest) {
    return this.essayService.getStories(req.user.id);
  }

  @Post('stories')
  @ApiOperation({
    summary: '스토리 생성',
    description: `
  새로운 스토리를 생성하고, 선택적으로 해당 스토리에 에세이를 추가합니다.

  **요청 바디:**
  - \`name\` (string): 생성할 스토리의 이름.
  - \`essayIds\` (number[]): 선택 사항으로, 스토리에 포함시킬 에세이의 ID 목록입니다. 에세이를 미포함할 경우 빈 배열(또는 값)을 전송해야 합니다.

  **동작 과정:**
  1. 사용자가 입력한 이름으로 새로운 스토리를 생성합니다.
  2. 선택적으로 전달된 에세이 ID 목록을 사용하여 해당 에세이들을 생성된 스토리에 추가합니다.
  3. 모든 작업이 완료되면 생성된 스토리를 반환합니다.

  **주의 사항:**
  - 에세이 ID 목록은 선택 사항이지만, 제공된 경우 유효한 에세이 ID여야 합니다.
  - 에세이 ID 목록이 빈 배열일 경우, 에세이 없이 스토리가 생성됩니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateStoryReqDto })
  async saveStory(@Req() req: ExpressRequest, @Body() data: CreateStoryReqDto) {
    return this.essayService.saveStory(req.user.id, data);
  }

  @Put('stories/:storyId')
  @ApiOperation({
    summary: '스토리 업데이트',
    description: `
  특정 스토리를 업데이트합니다. 요청 본문에 스토리 이름과 에세이 ID 목록을 포함할 수 있습니다.
  
  **경로 파라미터:**
  - \`storyId\`: 업데이트할 스토리의 ID

  **요청 본문:**
  - \`name\`: 새로운 스토리 이름 (선택 사항)
  - \`essayIds\`: 스토리에 포함시킬 에세이 ID 목록 (선택 사항)
  
  **동작 과정:**
  1. 사용자가 제공한 스토리 이름과 에세이 ID 목록을 기반으로 스토리를 업데이트합니다.
  2. 스토리 이름이 제공된 경우 스토리 이름을 업데이트합니다.
  3. 에세이 ID 목록이 제공된 경우, 기존 에세이와 새로운 에세이를 비교하여 추가 및 삭제 작업을 수행합니다.
  
  **주의 사항:**
  - 요청 본문에 스토리 이름과 에세이 ID 목록 둘 다 또는 하나만 포함할 수 있습니다.
  - 스토리 ID는 필수 경로 파라미터입니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: UpdateStoryReqDto })
  async updateStory(
    @Req() req: ExpressRequest,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() data: CreateStoryReqDto,
  ) {
    return this.essayService.updateStory(req.user.id, storyId, data);
  }

  @Delete('stories/:storyId')
  @ApiOperation({
    summary: '스토리 삭제',
    description: `
  특정 스토리를 삭제합니다.

  **경로 파라미터:**
  - \`storyId\`: 삭제할 스토리의 ID.

  **동작 과정:**
  1. 스토리 ID를 입력받아 해당 스토리를 삭제합니다.
  2. 삭제 성공 시 상태 코드 204를 반환합니다.

  **주의 사항:**
  - 유효한 스토리 ID를 전달해야 합니다.
  `,
  })
  @ApiResponse({ status: 204 })
  async deleteStory(@Req() req: ExpressRequest, @Param('storyId', ParseIntPipe) storyId: number) {
    return this.essayService.deleteStory(req.user.id, storyId);
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
  @ApiResponse({ status: 200, type: SentenceEssaySchemaDto })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async oneSentenceEssays(
    @Query('type', new DefaultValuePipe('first')) type: 'first' | 'last' = 'first',
    @Query('limit', new PagingParseIntPipe(6)) limit: number,
  ) {
    return await this.essayService.getSentenceEssays(type, limit);
  }

  @Put(':essayId/stories/:storyId')
  @ApiOperation({
    summary: '에세이의 스토리 변경',
    description: `
  특정 에세이의 소속 스토리를 변경합니다.
  
  **경로 파라미터:**
  - \`essayId\`: 변경할 에세이의 ID
  - \`storyId\`: 새로운 스토리의 ID
  
  **동작 과정:**
  1. 요청한 사용자의 ID를 기반으로 사용자를 조회합니다.
  2. 에세이 ID를 기반으로 에세이를 조회합니다.
  3. 사용자가 에세이에 대한 권한이 있는지 확인합니다.
  4. 에세이의 스토리를 새로운 스토리로 변경합니다.
  5. 변경된 에세이를 저장합니다.
  
  **주의 사항:**
  - 요청한 사용자가 해당 에세이에 대한 권한이 있어야 합니다.
  - 유효한 에세이 ID와 스토리 ID를 제공해야 합니다.
  `,
  })
  @ApiResponse({ status: 200, description: '에세이의 스토리가 성공적으로 변경.' })
  @ApiResponse({ status: 404, description: '에세이 또는 스토리를 찾을 수 없음.' })
  @ApiResponse({ status: 403, description: '에세이에 대한 권한이 없음.' })
  async updateEssayStory(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
  ) {
    return this.essayService.updateEssayStory(req.user.id, essayId, storyId);
  }

  @Delete(':essayId/stories')
  @ApiOperation({
    summary: '에세이 스토리 제거',
    description: `
  특정 에세이에서 스토리를 제거합니다. 에세이 ID를 경로 파라미터로 받아 해당 에세이와 연결된 스토리를 해제합니다.
  
  **경로 파라미터:**
  - \`essayId\`: 스토리를 제거할 에세이의 ID
  
  **동작 과정:**
  1. 요청된 에세이 ID를 기반으로 에세이를 조회합니다.
  2. 에세이와 연결된 스토리를 해제합니다.
  3. 변경된 에세이 정보를 저장합니다.
  
  **주의 사항:**
  - 유효한 에세이 ID를 제공해야 합니다.
  - 에세이를 작성한 사용자만 해당 에세이의 스토리를 제거할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async deleteEssayStory(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
  ) {
    return this.essayService.deleteEssayStory(req.user.id, essayId);
  }

  @Get('stories/related')
  @ApiOperation({
    summary: '스토리 생성 또는 수정시 사용될 에세이 리스트',
    description: `
  본인이 작성한 에세이 중 특정 스토리에 속하거나 스토리가 없는 에세이 목록을 조회합니다.
  
  **쿼리 파라미터:**
  - \`storyId\` (number, optional): 조회할 스토리의 고유 ID
  - \`page\` (number, optional): 조회할 페이지를 지정합니다. 기본값은 1입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 20입니다.
    
  **동작 과정:**
  1. 요청된 사용자 ID와 경로 매개변수 \`storyId\`를 이용하여 에세이를 조회합니다.
  2. 조회된 에세이 목록을 반환합니다.
    
  **주의 사항:**
  - 요청된 사용자 본인이 작성한 에세이만 조회됩니다.
  - \`storyId\`와 일치하는 스토리 또는 스토리가 없는 에세이만 조회됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: EssaysSummarySchemaDto })
  @ApiQuery({ name: 'storyId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEssayToUpdateStory(
    @Req() req: ExpressRequest,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(20)) limit: number,
  ) {
    return this.essayService.getEssayToUpdateStory(req.user.id, storyId, page, limit);
  }

  @Get('stories/:userId')
  @ApiOperation({
    summary: '타겟 유저 스토리 리스트',
    description: `
  특정 사용자가 작성한 스토리 목록을 조회합니다.

  **경로 파라미터:**
  - \`userId\`: 조회할 스토리 리스트의 작성자 ID.

  **동작 과정:**
  1. 요청된 사용자 ID를 이용하여 해당 사용자가 작성한 모든 스토리를 조회합니다.
  2. 조회된 스토리 목록을 반환합니다.

  **주의 사항:**
  - 반환된 스토리에는 각 스토리에 포함된 에세이의 카운트가 포함됩니다.
  - 올바른 사용자 ID를 전달해야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: StoriesResDto })
  async getUserStories(@Param('userId', ParseIntPipe) userId: number) {
    return this.essayService.getStories(userId);
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
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentViewedEssays(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getRecentViewedEssays(req.user.id, page, limit);
  }

  @Get('bookmark')
  @ApiOperation({
    summary: '북마크한 에세이 목록',
    description: `
  사용자가 북마크한 에세이 목록을 가져옵니다.
    
  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 한 페이지에 보여줄 에세이 수 (기본값: 10)

  **동작 과정:**
  1. 사용자의 ID를 기반으로 북마크한 에세이 목록을 조회합니다.
  2. 조회된 에세이 목록과 총 개수를 반환합니다.
    
  `,
  })
  @ApiResponse({ status: 200, type: EssaysSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserBookmarks(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.getUserBookmarks(req.user.id, page, limit);
  }

  @Post('bookmarks/:essayId')
  @ApiOperation({
    summary: '에세이 북마크 추가',
    description: `
  특정 에세이를 북마크합니다.

  **경로 파라미터:**
  - \`essayId\`: 북마크할 에세이의 ID
    
  **동작 과정:**
  1. 사용자의 ID와 에세이의 ID를 기반으로 북마크를 추가합니다.
  2. 성공 상태를 반환합니다.
    
  **주의 사항:**
  - 로그인한 사용자가 접근할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async addBookmark(@Req() req: ExpressRequest, @Param('essayId') essayId: number) {
    return this.essayService.addBookmark(req.user.id, essayId);
  }

  @Delete('bookmarks/:essayId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '에세이 북마크 삭제',
    description: `
  특정 에세이의 북마크를 삭제합니다.

  **경로 파라미터:**
  - \`essayId\`: 북마크를 삭제할 에세이의 ID
   
  **동작 과정:**
  1. 사용자의 ID와 에세이의 ID를 기반으로 북마크를 삭제합니다.
  2. 성공 상태를 반환합니다.
    
  **주의 사항:**
  - 로그인한 사용자가 접근할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async removeBookmark(@Req() req: ExpressRequest, @Param('essayId') essayId: number) {
    return this.essayService.removeBookmark(req.user.id, essayId);
  }

  @Get('search')
  @ApiOperation({
    summary: '에세이 검색',
    description: `
  키워드를 기반으로 에세이를 검색합니다. 
  
  **쿼리 파라미터:**
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
    type: EssaysSchemaDto,
  })
  async searchEssays(
    @Query('keyword') keyword: string,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.essayService.searchEssays(keyword, page, limit);
  }

  @Get(':essayId')
  @ApiOperation({
    summary: '에세이 상세조회',
    description: `
  특정 에세이의 상세 정보를 조회합니다. 요청한 사용자가 해당 에세이의 작성자가 아니고 에세이 상태가 PRIVATE일 경우, 조회가 거부됩니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 조회할 에세이의 ID

  **동작 과정:**
  1. 요청된 에세이 ID로 에세이를 조회합니다.
  2. 요청한 사용자가 에세이의 작성자가 아닌 경우, 에세이 상태가 PRIVATE일 때 조회가 거부됩니다.
  3. 조회에 성공한 경우 조회수를 증가시킵니다.
  4. 이전에 작성된 에세이를 함께 조회합니다.
  5. 조회된 에세이와 이전 에세이를 반환합니다.

  **주의 사항:**
  - 에세이 ID는 유효한 숫자여야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: EssayResDto })
  async getEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.getEssay(req.user.id, essayId);
  }
}
