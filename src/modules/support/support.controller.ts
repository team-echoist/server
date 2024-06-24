import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { NoticeResDto } from './dto/response/noticeRes.dto';
import { NoticesSchemaDto } from './dto/schema/noticesSchema.dto';

@ApiTags('Support')
@UseGuards(AuthGuard('jwt'))
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('notices')
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: `
  공지사항 목록을 페이지네이션하여 조회합니다. 페이지와 페이지당 항목 수를 파라미터로 받습니다.

  **쿼리 파라미터:**
  - \`page\` (number, optional): 페이지 번호 (기본값: 1)
  - \`limit\` (number, optional): 페이지당 항목 수 (기본값: 10)
  `,
  })
  @ApiResponse({ status: 200, type: NoticesSchemaDto })
  async getNotices(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.supportService.getNotices(page, limit);
  }

  @Get('notices/:noticeId')
  @ApiOperation({
    summary: '공지사항 상세 조회',
    description: `
  특정 공지사항의 상세 정보를 조회합니다.

  **경로 파라미터:**
  - \`noticeId\` (number, required): 조회할 공지사항의 ID
  `,
  })
  @ApiResponse({ status: 200, type: NoticeResDto })
  async getNotice(@Param('noticeId', ParseIntPipe) noticeId: number) {
    return this.supportService.getNotice(noticeId);
  }
}
