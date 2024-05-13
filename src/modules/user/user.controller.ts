import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { UserImageReqDto } from './dto/request/userImageReq.dto';

@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('image')
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiBody({ type: UserImageReqDto })
  @UseInterceptors(FileInterceptor('image'))
  async saveProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.userService.saveProfileImage(req.user.id, file);
  }
}
