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
import { UserImageReqDto } from './dto/request/userImageReq.dto';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { UserResDto } from './dto/response/userRes.dto';
import { ProfileImageResDto } from './dto/response/profileImageRes.dto';
import { UserInfoResDto } from './dto/response/userInfoRes.dto';
import { UserSummaryDto } from './dto/userSummary.dto';

@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('images')
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiResponse({ type: ProfileImageResDto })
  @ApiBody({ type: UserImageReqDto })
  @UseInterceptors(FileInterceptor('image'))
  async saveProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.userService.saveProfileImage(req.user.id, file);
  }

  @Put()
  @ApiOperation({ summary: '유저 업데이트' })
  @ApiResponse({ status: 200, type: UserResDto })
  @ApiBody({ type: UpdateUserReqDto })
  async updateUser(@Req() req: ExpressRequest, @Body() data: UpdateUserReqDto) {
    return this.userService.updateUser(req.user.id, data);
  }

  @Get('follows')
  @ApiOperation({ summary: '팔로우 리스트' })
  @ApiResponse({ status: 200, type: [UserSummaryDto] })
  async getFollowings(@Req() req: ExpressRequest) {
    return this.userService.getFollowings(req.user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: '유저 프로필' })
  @ApiResponse({ status: 200, type: UserInfoResDto })
  async getUserInfo(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserInfo(userId);
  }

  @Post('follows/:userId')
  @ApiOperation({ summary: '팔로우' })
  @ApiResponse({ status: 201 })
  async follow(@Req() req: ExpressRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.userService.follow(req.user.id, userId);
  }

  @Delete('follows/:userId')
  @ApiOperation({ summary: '팔로우 취소' })
  @ApiResponse({ status: 204 })
  async upFollow(@Req() req: ExpressRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.userService.unFollow(req.user.id, userId);
  }
}
