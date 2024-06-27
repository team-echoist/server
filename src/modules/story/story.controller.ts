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
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoryService } from './story.service';
import { StoriesResDto } from './dto/response/storiesRes.dto';
import { Request as ExpressRequest } from 'express';
import { CreateStoryReqDto } from './dto/repuest/createStoryReq.dto';
import { UpdateStoryReqDto } from './dto/repuest/updateStoryReq.dto';
import { StoryUpdateEssaysResDto } from '../essay/dto/response/storyUpdateEssaysRes.dto';
import { OptionalParseIntPipe } from '../../common/pipes/optionalParseInt.pipe';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';

@ApiTags('Story')
@Controller('stories')
@UseGuards(AuthGuard('jwt'))
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
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
    return this.storyService.getStories(req.user.id);
  }

  @Post()
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
    return this.storyService.saveStory(req.user.id, data);
  }

  @Put(':storyId')
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
    return this.storyService.updateStory(req.user.id, storyId, data);
  }

  @Delete(':storyId')
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
    return this.storyService.deleteStory(req.user.id, storyId);
  }

  @Put(':storyId/essays/:essayId')
  @ApiOperation({
    summary: '에세이의 스토리 변경',
    description: `
  특정 에세이의 소속 스토리를 변경합니다.
  
  **경로 파라미터:**
  - \`storyId\`: 새로운 스토리의 ID
  - \`essayId\`: 변경할 에세이의 ID
  
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
    return this.storyService.updateEssayStory(req.user.id, essayId, storyId);
  }

  @Delete('essays/:essayId')
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
    return this.storyService.deleteEssayStory(req.user.id, essayId);
  }

  @Get('related')
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
  @ApiResponse({ status: 200, type: StoryUpdateEssaysResDto })
  @ApiQuery({ name: 'storyId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEssayToUpdateStory(
    @Req() req: ExpressRequest,
    @Query('storyId', OptionalParseIntPipe) storyId: number,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(20)) limit: number,
  ) {
    return this.storyService.getEssayToUpdateStory(req.user.id, storyId, page, limit);
  }

  @Get(':userId')
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
    return this.storyService.getStories(userId);
  }
}
