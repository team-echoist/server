import { Body, Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../../common/guards/jwtAuth.guard';
import { ReportService } from '../core/report.service';
import { CreateReportReqDto } from '../dto/request/createReportReq.dto';

@ApiTags('Report')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':essayId')
  @ApiOperation({
    summary: '에세이 신고',
    description: `
  특정 에세이를 신고합니다.
      
  **경로 파라미터:**
  - \`essayId\` (number, required): 신고할 에세이의 ID
      
  **동작 과정:**
  1. 에세이가 PRIVATE 상태인 경우 신고할 수 없습니다.
  2. 중복 신고는 불가능합니다.
  3. 신고가 성공적으로 접수되면, 에세이 작성자의 평판이 감소됩니다.
      
  **주의 사항:**
  - 요청 바디의 \`reason\` 필드는 필수입니다. `,
  })
  @ApiResponse({ status: 201 })
  @ApiBody({ type: CreateReportReqDto })
  async reportEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() data: CreateReportReqDto,
  ) {
    return this.reportService.createReport(req.user.id, essayId, data);
  }
}
