import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FollowService } from './follow.service';
import { UsersSummaryResDto } from '../user/dto/response/usersSummaryRes.dto';
import { Request as ExpressRequest } from 'express';
import { PagingParseIntPipe } from '../../common/pipes/pagingParseInt.pipe';

@ApiTags('Follow')
@Controller('follows')
@UseGuards(AuthGuard('jwt'))
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get()
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
  @ApiResponse({ status: 200, type: UsersSummaryResDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowings(
    @Req() req: ExpressRequest,
    @Query('page', new PagingParseIntPipe(1)) page: number,
    @Query('limit', new PagingParseIntPipe(20)) limit: number,
  ) {
    return this.followService.getFollowings(req.user.id, page, limit);
  }

  @Post(':userId')
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
    return this.followService.follow(req.user.id, userId);
  }

  @Delete(':userId')
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
    return this.followService.unFollow(req.user.id, userId);
  }
}
