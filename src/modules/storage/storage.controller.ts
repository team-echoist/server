import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from './storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';

@ApiTags('Storage')
@UseGuards(AuthGuard('jwt'))
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('profile')
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiResponse({ status: 201, type: 'imageUrl' })
  @UseInterceptors(FileInterceptor('profile'))
  async uploadProfileImage(@Req() req: ExpressRequest, @UploadedFile() file: Express.Multer.File) {
    return this.storageService.uploadProfileImage(req.user.id, file);
  }
}
