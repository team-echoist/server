import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { SupportService } from './support.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { NoticeResDto } from './dto/response/noticeRes.dto';
import { NoticesSchemaDto } from './dto/schema/noticesSchema.dto';
import { InquiryReqDto } from './dto/request/inquiryReq.dto';
import { InquiriesResDto } from './dto/response/inquiriesRes.dto';
import { UpdatedHistoriesResDto } from './dto/response/updatedHistoriesRes.dto';

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

  @Post('inquiries')
  @ApiOperation({
    summary: '고객 문의 작성',
    description: `
  사용자가 고객 문의를 작성합니다.
  
  **요청 본문:**
  - \`title\`: 문의 제목
  - \`content\`: 문의 내용
  - \`type\`: 문의 유형
  
  **동작 과정:**
  1. 사용자가 문의 제목, 내용, 유형을 작성합니다.
  2. 서버는 문의를 저장하고, 저장된 문의 정보를 반환합니다.
  
  **주의 사항:**
  - 제목과 내용은 비워둘 수 없습니다.
  `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: InquiryReqDto })
  async createInquiry(@Req() req: ExpressRequest, @Body() data: InquiryReqDto) {
    return this.supportService.createInquiry(req.user.id, data);
  }

  @Get('inquiries')
  @ApiOperation({
    summary: '고객 문의 목록 조회',
    description: `
  사용자가 작성한 모든 고객 문의를 조회합니다.
  
  **동작 과정:**
  1. 사용자가 작성한 모든 문의를 조회합니다.
  2. 조회된 문의 목록을 반환합니다.
  
  `,
  })
  @ApiResponse({ status: 200, type: InquiriesResDto })
  async getInquiries(@Req() req: ExpressRequest) {
    return this.supportService.getInquiries(req.user.id);
  }

  @Get('inquiries/:inquiryId')
  @ApiOperation({
    summary: '고객 문의 상세 조회',
    description: `
  사용자가 작성한 문의를 상세 조회합니다.
  
  **동작 과정:**
  1. 사용자가 문의를 조회합니다.
  2. 조회된 문의의 상세 정보 및 답변을 반환합니다.
  
  `,
  })
  @ApiResponse({ status: 200, type: '' })
  async getInquiry(
    @Req() req: ExpressRequest,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
  ) {
    return this.supportService.getInquiry(req.user.id, inquiryId);
  }

  @Get('updated-histories')
  @ApiOperation({
    summary: '전체 업데이트 히스토리 조회 (유저용)',
    description: `
  유저가 모든 업데이트 히스토리를 조회합니다.

  **쿼리 파라미터:**
  - \`page\`: 페이지 번호 (기본값: 1)
  - \`limit\`: 페이지당 항목 수 (기본값: 10)

  **동작 과정:**
  1. 모든 업데이트 히스토리를 페이지네이션하여 조회합니다.
  2. 작성자 정보를 제외한 업데이트 히스토리 목록을 반환합니다.

  **주의 사항:**
  - 유저 권한으로 접근할 수 있습니다.
  `,
  })
  @ApiResponse({ status: 200, type: UpdatedHistoriesResDto })
  async getUserUpdateHistories(
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(10)) limit: number,
  ) {
    return this.supportService.getUserUpdateHistories(page, limit);
  }
}
