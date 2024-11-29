import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { DeactivateReqDto } from '../../user/dto/request/deacvivateReq.dto';
import { AuthService } from '../core/auth.service';

@ApiTags('Auth-management')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthManagementController {
  constructor(private readonly authService: AuthService) {}

  @Post('deactivate')
  @ApiOperation({
    summary: '회원탈퇴 요청',
    description: `
  사용자가 회원탈퇴를 요청합니다.
  
  **요청 본문:**
  - \`reasons\`: 이용자가 탈퇴를 요청한 사유.
  
  **동작 과정:**
  1. 사용자가 회원탈퇴를 요청합니다.
  2. 30일간의 유예기간이 부여됩니다.
  3. 유예기간 동안에는 계정 복구 요청이 가능합니다.
  4. 유예기간이 지나면 탈퇴가 진행됩니다.
  
  **주의 사항:**
  - 유예기간 동안 계정 복구를 요청하지 않으면 계정이 영구적으로 삭제됩니다.
  - 유예기간 내에 __모든 요청__은 \`202\`를 반환합니다.
  `,
  })
  @ApiResponse({
    status: 200,
  })
  @ApiBody({ type: DeactivateReqDto })
  async requestDeactivation(@Req() req: ExpressRequest, @Body() data: DeactivateReqDto) {
    return this.authService.requestDeactivation(req.user.id, data);
  }

  @Post('reactivate')
  @ApiOperation({
    summary: '회원탈퇴 요청 취소',
    description: `
  사용자가 회원탈퇴 요청을 철회합니다.
  해당 api는 삭제될 예정입니다. \`auth\` 경로를 이용해주세요.
  
  **동작 과정:**
  1. 사용자가 회원탈퇴 요청을 취소합니다.
  2. 계정이 다시 활성상태로 변경됩니다.

  **주의 사항:**
  - 유예기간 내에만 회원탈퇴 요청을 취소할 수 있습니다.
  - 유예기간이 지나면 계정을 복구할 수 없습니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async cancelDeactivation(@Req() req: ExpressRequest) {
    return this.authService.cancelDeactivation(req.user.id);
  }

  @Delete()
  @ApiOperation({
    summary: '회원탈퇴 바로 진행',
    description: `
    사용자가 즉시 회원탈퇴를 요청합니다. 
    
    **동작 과정:**
    1. 사용자가 회원탈퇴를 요청합니다.
    2. 사용자의 계정을 논리적으로 삭제하고, 관련 데이터를 처리합니다.
    
    **주의 사항:**
    - 계정이 즉시 삭제되며, 복구가 불가능합니다.
    `,
  })
  @ApiResponse({ status: 200 })
  async deleteAccount(@Req() req: ExpressRequest) {
    return this.authService.deleteAccount(req.user.id);
  }
}
