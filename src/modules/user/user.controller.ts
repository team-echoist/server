import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { ProfileImageReqDto } from './dto/request/profileImageReq.dto';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { UserResDto } from './dto/response/userRes.dto';
import { ProfileImageUrlResDto } from './dto/response/profileImageUrlRes.dto';
import { UserSummaryWithStatsResDto } from './dto/response/userSummaryWithStatsRes.dto';
import { UserSummaryWithCountResDto } from './dto/response/userSummaryWithCountRes.dto';
import { DeactivateReqDto } from './dto/request/deacvivateReq.dto';
import { UserSummaryResDto } from './dto/response/userSummaryRes.dto';

@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  - 유예기간 내에 로그인시 202응답코드를 반환합니다.
  `,
  })
  @ApiResponse({
    status: 200,
  })
  @ApiBody({ type: DeactivateReqDto })
  async requestDeactivation(@Req() req: ExpressRequest, @Body() data: DeactivateReqDto) {
    return this.userService.requestDeactivation(req.user.id, data);
  }

  @Post('reactivate')
  @ApiOperation({
    summary: '회원탈퇴 요청 취소',
    description: `
  사용자가 회원탈퇴 요청을 취소하고 계정을 복구합
  **동작 과정:**
  1. 사용자가 회원탈퇴 요청을 취소합니다.
  2. 계정이 다시 활성상태로 변경됩니다.

  **주의 사항:**
  - 유예기간 내에만 회원탈퇴 요청을 취소할 수 있습니다.
  - 유예기간이 지나면 계정을 복구할 수 없습니다.
  `,
  })
  @ApiResponse({
    status: 200,
  })
  async cancelDeactivation(@Req() req: ExpressRequest) {
    return this.userService.cancelDeactivation(req.user.id);
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
  - \`gender\` (선택적): 성별을 설정합니다.
  - \`profileImage\` (선택적): 프로필 이미지를 설정합니다.
  - \`birthDate\` (선택적): 생년월일을 설정합니다.
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
  - 닉네임이 기본 닉네임 테이블에 있는 경우, 중복되지 않는 닉네임을 사용해야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserResDto })
  @ApiBody({ type: UpdateUserReqDto })
  async updateUser(@Req() req: ExpressRequest, @Body() data: UpdateUserReqDto) {
    return this.userService.updateUser(req.user.id, data);
  }

  @Get('summary')
  @ApiOperation({
    summary: '유저 요약 정보 및 주간 에세이 통계 조회',
    description: `
  로그인한 사용자의 요약 정보를 조회합니다. 

  **요청 헤더:**
  - \`Authorization\`: Bearer {token}

  **동작 과정:**
  1. 요청 헤더의 인증 토큰을 사용하여 사용자를 식별합니다.
  2. 사용자의 요약 정보를 포함하여 최근 5주간의 에세이 작성 통계를 반환합니다.

  **응답 필드:**
  - \`summary\`: 사용자의 기본 정보 (ID, 닉네임, 프로필 이미지, 가입일 등)
  - \`weeklyEssayCounts\`: 최근 5주간의 주별 에세이 작성 개수 및 기간

  **주의 사항:**
  - 인증 토큰이 유효하지 않거나 제공되지 않으면 \`401 Unauthorized\` 에러가 발생합니다.
  - 요청이 성공하면 \`200 OK\` 상태를 반환합니다.
  `,
  })
  @ApiResponse({ type: UserSummaryWithCountResDto })
  async userSummary(@Req() req: ExpressRequest) {
    return this.userService.getUserSummary(req.user.id);
  }

  @Get('info')
  @ApiOperation({
    summary: '본인 기본정보',
    description: `
  본인 아이디, 닉네임, 프로필이미지, 생성일, 최초접속여부 ,위치기반서비스동의여부, 등록된 디바이스 등을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryResDto })
  async getMyInfo(@Req() req: ExpressRequest) {
    return this.userService.getUserInfo(req.user.id);
  }

  @Get('profile/my')
  @ApiOperation({
    summary: '본인 프로필 조회',
    description: `
  본인 프로필 정보를 조회합니다. 이 API는 사용자의 기본 정보와 에세이 통계를 반환합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.
  2. 사용자의 에세이 통계를 조회합니다.
  3. 조회된 정보를 합쳐서 반환합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryWithStatsResDto })
  async getMyProfile(@Req() req: ExpressRequest) {
    return this.userService.getUserProfile(req.user.id);
  }

  @Get('profile/:userId')
  @ApiOperation({
    summary: '타겟 유저 프로필',
    description: `
  특정 사용자의 프로필 정보를 조회합니다. 이 API는 사용자의 기본 정보와 에세이 통계를 반환합니다.

  **경로 파라미터:**
  - \`userId\`: 조회할 사용자의 고유 ID

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자의 기본 정보를 조회합니다.
  2. 사용자의 에세이 통계를 조회합니다.
  3. 조회된 정보를 합쳐서 반환합니다.

  **주의 사항:**
  - 유효한 사용자 ID가 제공되어야 합니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryWithStatsResDto })
  async getUserProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserProfile(userId);
  }
}
