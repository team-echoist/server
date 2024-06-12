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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { ProfileImageReqDto } from './dto/request/profileImageReq.dto';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { UserResDto } from './dto/response/userRes.dto';
import { ProfileImageUrlResDto } from './dto/response/profileImageUrlRes.dto';
import { UserInfoResDto } from './dto/response/userInfoRes.dto';
import { UserSummaryResDto } from './dto/response/userSummaryRes.dto';
import { BadgesSchemaDto } from '../badge/dto/schema/badgesSchema.dto';
import { BadgesWithTagsSchemaDto } from '../badge/dto/schema/badgesWithTagsSchema.dto';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';
import { UserSummaryResSchemaDto } from './dto/schema/userSummaryResSchema.dto';
import { UserSummaryWithCountSchemaDto } from './dto/schema/userSummaryWithCountSchema.dto';

@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  - \`nickname\` (선택적): 새로운 닉네임을 설정합니다.
  - \`password\` (선택적): 새로운 비밀번호를 설정합니다.
  - \`gender\` (선택적): 성별을 설정합니다.
  - \`profileImage\` (선택적): 프로필 이미지를 설정합니다.
  - \`birthDate\` (선택적): 생년월일을 설정합니다.

  **동작 과정:**
  1. 사용자 ID를 기반으로 사용자의 기존 정보를 조회합니다.
  2. 기존 닉네임이 기본 닉네임 테이블에 포함되어 있다면, \`isUsed\` 필드를 \`false\`로 업데이트합니다.
  3. 새로운 닉네임이 기본 닉네임 테이블에 포함되어 있다면, \`isUsed\` 필드를 \`true\`로 업데이트합니다.
  4. 제공된 데이터로 사용자의 정보를 업데이트합니다.
  5. 비밀번호가 포함된 경우 해시 처리합니다.
  6. 업데이트된 사용자 정보를 반환합니다.

  **주의 사항:**
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

  @Get('follows')
  @ApiOperation({
    summary: '팔로우 리스트',
    description: `
  현재 사용자가 팔로우하고 있는 사용자 목록을 조회합니다.
  
  **쿼리 파라미터:**
  - \`page\` (number, optional): 조회할 페이지를 지정합니다. 기본값은 1입니다.
  - \`limit\` (number, optional): 조회할 에세이 수를 지정합니다. 기본값은 20입니다.

  **동작 과정:**
  1. 사용자 ID를 기반으로 팔로우하고 있는 사용자 목록을 조회합니다.
  2. 각 팔로우 목록을 DTO로 변환하여 반환합니다.

  **주의 사항:**
  - 요청한 사용자가 팔로우하고 있는 사용자 목록을 반환합니다.
  - 팔로우 정보는 간략한 사용자 정보로 변환되어 반환됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: UserSummaryResSchemaDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowings(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(20)) limit: number,
  ) {
    return this.userService.getFollowings(req.user.id, page, limit);
  }

  @Post('follows/:userId')
  @ApiOperation({
    summary: '팔로우',
    description: `
  다른 사용자를 팔로우합니다.

  **경로 파라미터:**
  - \`userId\`: 팔로우할 사용자의 고유 ID

  **동작 과정:**
  1. 요청한 사용자의 ID와 팔로우할 사용자의 ID를 받아 팔로우 요청을 처리합니다.
  2. 팔로우할 사용자가 존재하는지 확인합니다.
  3. 사용자가 자신을 팔로우하려는 경우 예외를 던집니다.
  4. 이미 팔로우하고 있는 경우 예외를 던집니다.
  5. 팔로우 요청을 데이터베이스에 저장합니다.

  **주의 사항:**
  - 팔로우할 사용자의 ID가 유효해야 합니다.
  - 사용자가 자신을 팔로우할 수 없습니다.
  - 이미 팔로우 중인 경우 예외가 발생합니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async follow(@Req() req: ExpressRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.userService.follow(req.user.id, userId);
  }

  @Delete('follows/:userId')
  @ApiOperation({
    summary: '팔로우 취소',
    description: `
  다른 사용자에 대한 팔로우를 취소합니다.

  **경로 파라미터:**
  - \`userId\`: 팔로우를 취소할 사용자의 고유 ID

  **동작 과정:**
  1. 요청한 사용자의 ID와 팔로우를 취소할 사용자의 ID를 받아 팔로우 취소 요청을 처리합니다.
  2. 팔로우 관계가 존재하는지 확인합니다.
  3. 팔로우 관계가 존재하지 않으면 예외를 던집니다.
  4. 팔로우 관계를 데이터베이스에서 삭제합니다.

  **주의 사항:**
  - 팔로우를 취소할 사용자의 ID가 유효해야 합니다.
  - 팔로우 관계가 존재하지 않으면 예외가 발생합니다.
  `,
  })
  @ApiResponse({ status: 204 })
  async upFollow(@Req() req: ExpressRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.userService.unFollow(req.user.id, userId);
  }

  @Post('badges/level/:badgeId')
  @ApiOperation({
    summary: '뱃지 레벨업',
    description: `
  사용자가 소유한 특정 뱃지의 레벨을 올립니다. 뱃지를 레벨업하기 위해서는 해당 뱃지에 필요한 경험치가 충분해야 합니다.

  **경로 파라미터:**
  - \`badgeId\`: 레벨업할 뱃지의 고유 ID

  **동작 과정:**
  1. 사용자의 ID와 레벨업할 뱃지의 ID를 받아 뱃지를 조회합니다.
  2. 해당 뱃지가 사용자가 소유한 뱃지인지 확인합니다.
  3. 뱃지의 경험치가 레벨업에 충분한지 확인합니다.
  4. 경험치가 충분하지 않으면 예외를 던집니다.
  5. 뱃지의 레벨을 올리고 경험치를 차감합니다.
  6. 업데이트된 뱃지 정보를 데이터베이스에 저장합니다.

  **주의 사항:**
  - 뱃지를 레벨업하기 위해서는 최소한 10의 경험치가 필요합니다.
  - 사용자가 소유하지 않은 뱃지를 레벨업하려고 하면 예외가 발생합니다.
  `,
  })
  @ApiResponse({ status: 201 })
  async levelUpBadge(@Req() req: ExpressRequest, @Param('badgeId', ParseIntPipe) badgeId: number) {
    return this.userService.levelUpBadge(req.user.id, badgeId);
  }

  @Get('badges')
  @ApiOperation({
    summary: '획득한 뱃지 리스트',
    description: `
  사용자가 획득한 모든 뱃지 목록을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자가 획득한 모든 뱃지를 조회합니다.
  2. 조회된 뱃지 목록을 반환합니다.

  **주의 사항:**
  - 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: BadgesSchemaDto })
  async userBadges(@Req() req: ExpressRequest) {
    return this.userService.getBadges(req.user.id);
  }

  @Get('badges/detail')
  @ApiOperation({
    summary: '획득한 뱃지 상세 리스트',
    description: `
  사용자가 획득한 모든 뱃지와 해당 뱃지와 연관된 태그 목록을 조회합니다.

  **동작 과정:**
  1. 사용자의 ID를 기반으로 해당 사용자가 획득한 모든 뱃지와 연관된 태그를 조회합니다.
  2. 조회된 뱃지와 태그 목록을 반환합니다.
  3. 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.

  **주의 사항:**
  - 사용자가 아직 획득하지 않은 뱃지도 기본 정보와 함께 반환됩니다.
  - 각 뱃지에는 연관된 태그 목록이 포함됩니다.
  `,
  })
  @ApiResponse({ status: 200, type: BadgesWithTagsSchemaDto })
  async userBadgesWithTags(@Req() req: ExpressRequest) {
    return this.userService.getBadgeWithTags(req.user.id);
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
  @ApiResponse({ type: UserSummaryWithCountSchemaDto })
  async userSummary(@Req() req: ExpressRequest) {
    return this.userService.getUserSummary(req.user.id);
  }

  @Get(':userId')
  @ApiOperation({
    summary: '유저 프로필',
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
  @ApiResponse({ status: 200, type: UserInfoResDto })
  async getUserInfo(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserInfo(userId);
  }
}
