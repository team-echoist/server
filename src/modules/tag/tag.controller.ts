import { ApiTags } from '@nestjs/swagger';
import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Tag')
@UseGuards(AuthGuard('jwt'))
@Controller('tag')
export class TagController {}
