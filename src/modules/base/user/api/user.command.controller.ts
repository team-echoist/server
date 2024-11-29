import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { UserService } from '../core/user.service';
import { DeactivateReqDto } from '../dto/request/deacvivateReq.dto';
import { ProfileImageReqDto } from '../dto/request/profileImageReq.dto';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { ProfileImageUrlResDto } from '../dto/response/profileImageUrlRes.dto';
import { UserResDto } from '../dto/response/userRes.dto';

@ApiTags('User-command')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserCommandController {
  constructor(private readonly userService: UserService) {}

  // todo 삭제
  @Post('deactivate')
  @ApiOperation({
    summary: '[삭제예정] 회원탈퇴 요청',
    description: `
  사용자가 회원탈퇴를 요청합니다.
  해당 api는 삭제될 예정입니다. \`auth\` 경로를 이용해주세요.
  
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
    return this.userService.requestDeactivation(req.user.id, data);
  }

  // todo 삭제
  @Post('reactivate')
  @ApiOperation({
    summary: '[삭제예정] 회원탈퇴 요청 취소',
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
    return this.userService.cancelDeactivation(req.user.id);
  }

  // todo 삭제
  @Delete()
  @ApiOperation({
    summary: '[삭제예정] 회원탈퇴 바로 진행',
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
    return this.userService.deleteAccount(req.user.id);
  }

  @Post('images')
  @ApiOperation({
    summary: '프로필 이미지 업로드',
    description: `
  사용자의 프로필 이미지를 업로드합니다.

  **요청 본문:**
  - \`image\`: 업로드할 이미지 파일 (Multer를 사용하여 업로드)

  **동작 과정:**
  1. 사용자의 프로필 이미지를 업로드하기 위해 이미지 파일을 받습니다.
  2. 사용자가 이미 프로필 이미지를 가지고 있는 경우, 기존 이미지를 덮어씁니다.
  3. 새로운 이미지 파일을 S3에 업로드합니다.
  4. 업로드된 이미지의 URL을 사용자 프로필에 저장합니다.
  5. 저장된 이미지 URL을 반환합니다.

  **주의 사항:**
  - 서비스에서 기본으로 제공하는 프로필 이미지로 변경하는 경우 해당 API 호출은 불필요합니다. 유저 업데이트 API를 바로 이용해주세요.
  - 이미지 파일은 multipart/form-data 형식으로 전송되어야 합니다.
  - 이미지 파일의 확장자는 원본 파일의 확장자를 사용합니다.
  `,
  })
  @ApiResponse({ type: ProfileImageUrlResDto })
  @ApiBody({ type: ProfileImageReqDto })
  @UseInterceptors(FileInterceptor('image'))
  async saveProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.userService.saveProfileImage(req.user.id, file);
  }

  @Delete('images')
  @ApiOperation({
    summary: '프로필 이미지 삭제',
    description: `
  사용자의 프로필 이미지를 삭제합니다.

  **동작 과정:**
  1. 사용자 ID를 기반으로 프로필 이미지를 조회합니다.
  2. 프로필 이미지가 존재하지 않는 경우, 예외를 던집니다.
  3. 프로필 이미지를 S3에서 삭제합니다.
  4. 사용자 엔티티에서 프로필 이미지 URL을 제거하고 저장합니다.
  5. 프로필 이미지가 성공적으로 삭제되었음을 반환합니다.

  **주의 사항:**
  - 프로필 이미지가 존재하지 않는 경우, 404 예외를 반환합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async deleteProfileImage(@Req() req: ExpressRequest) {
    return this.userService.deleteProfileImage(req.user.id);
  }

  @Put()
  @ApiOperation({
    summary: '유저 업데이트',
    description: `
  사용자의 정보를 업데이트합니다.

  **요청 본문:**
  - 모든 필드는 선택적입니다.
  - \`email\` (선택적): 새로운 이메일을 설정합니다.
  - \`nickname\` (선택적): 새로운 닉네임을 설정합니다.
  - \`password\` (선택적): 새로운 비밀번호를 설정합니다.
  - \`gender\` (선택적): 성별을 설정합니다. 현재 사용하지 않습니다.
  - \`profileImage\` (선택적): 프로필 이미지를 설정합니다.
  - \`birthDate\` (선택적): 생년월일을 설정합니다. 현재 사용하지 않습니다.
  - \`isFirst\` (선택적): 최초접속 여부를 설정합니다.
  - \`locationConsent:\` (선택적): 위치기반서비스 동의 여부를 설정합니다.

  **동작 과정:**
  1. 사용자 ID를 기반으로 사용자의 기존 정보를 조회합니다.
  2. 기존 닉네임이 기본 닉네임 테이블에 포함되어 있다면, \`isUsed\` 필드를 \`false\`로 업데이트합니다.
  3. 새로운 닉네임이 기본 닉네임 테이블에 포함되어 있다면, \`isUsed\` 필드를 \`true\`로 업데이트합니다.
  4. 제공된 데이터로 사용자의 정보를 업데이트합니다.
  5. 비밀번호가 포함된 경우 해시 처리합니다.
  6. 업데이트된 사용자 정보를 반환합니다.

  **주의 사항:**
  - 이메일 변경 시 이메일 중복 체크 API를 먼저 사용해야 합니다.
  - 비밀번호를 변경할 경우, 해시 처리를 위해 bcrypt를 사용합니다.
  - 요청 본문에서 선택적인 필드를 포함할 수 있습니다.
  - 닉네임이 기본 닉네임 테이블에 있는 경우, 중복되지 않는 닉네임을 사용해야 합니다. 닉네임 중복 검사 api를 사용하세요.
  `,
  })
  @ApiResponse({ status: 200, type: UserResDto })
  @ApiBody({ type: UpdateUserReqDto })
  async updateUser(@Req() req: ExpressRequest, @Body() data: UpdateUserReqDto) {
    return this.userService.updateUser(req.user.id, data);
  }
}
