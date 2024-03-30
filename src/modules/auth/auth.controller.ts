import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../entities/user.entity';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserResDto } from './dto/userRes.dto';
import { LoginReqDto } from './dto/loginReq.dto';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '회원가입',
    description: '회원 가입 후 응답 헤더에 JWT 추가',
  })
  @Post('register')
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201, type: UserResDto })
  @UsePipes(new ValidationPipe())
  async register(@Body() createUserDto: CreateUserReqDto, @Res() res: Response): Promise<void> {
    const user = await this.authService.register(createUserDto);
    const jwt = this.authService.generateJWT(user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.CREATED).send();
    return;
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '로그인 후 응답 헤더에 JWT 추가',
  })
  @ApiBody({ type: LoginReqDto })
  @ApiResponse({ status: 200 })
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: RequestWithUser, @Res() res: Response): Promise<void> {
    const jwt = this.authService.generateJWT(req.user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).send();
    return;
  }
}
