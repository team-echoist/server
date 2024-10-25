import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookmarkService } from './bookmark.service';
import { SummaryEssaysResDto } from '../essay/dto/response/SummaryEssaysRes.dto';
import { Request as ExpressRequest } from 'express';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { EssayIdsReqDto } from './dto/request/essayIdsReq.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuth.guard';

@ApiTags('Bookmark')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
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
  @ApiResponse({ status: 200, type: SummaryEssaysResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserBookmarks(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.bookmarkService.getUserBookmarks(req.user.id, page, limit);
  }

  @Post(':essayId')
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
  - 자신의 에세이는 마킹할 수 없습니다.
  - \`private\`상태의 에세이는 마킹할 수 없습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async addBookmark(@Req() req: ExpressRequest, @Param('essayId') essayId: number) {
    return this.bookmarkService.addBookmark(req.user.id, essayId);
  }

  @Put('')
  @ApiOperation({
    summary: '에세이 북마크 삭제',
    description: `
  특정 에세이들의 북마크를 삭제합니다.

  **요청 본문:**
  - \`essayIds\`: 북마크를 삭제할 에세이의 ID 배열
   
  **동작 과정:**
  1. 사용자의 ID와 에세이의 ID를 기반으로 북마크를 삭제합니다.
  2. 성공 상태를 반환합니다.
    
  **주의 사항:**
  - 로그인한 사용자가 접근할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: EssayIdsReqDto })
  async removeBookmarks(@Req() req: ExpressRequest, @Body() body: EssayIdsReqDto) {
    return this.bookmarkService.removeBookmarks(req.user.id, body.essayIds);
  }

  @Delete('reset')
  @ApiOperation({
    summary: '사용자의 모든 북마크 삭제',
    description: `
  사용자의 모든 북마크를 삭제합니다.

  **동작 과정:**
  1. 로그인한 사용자의 ID를 기반으로 모든 북마크를 삭제합니다.
  2. 성공 상태를 반환합니다.

  **주의 사항:**
  - 로그인한 사용자가 접근할 수 있습니다.
  - 큐 기반 백그라운드 작업입니다. 성공 응답을 받은 후에도 실제 적용까지 시간이 걸릴 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async resetBookmarks(@Req() req: ExpressRequest) {
    return this.bookmarkService.resetBookmarks(req.user.id);
  }
}
