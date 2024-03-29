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
import { UserService } from './user.service';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../entities/user.entity';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';
import { UserResDto } from './dto/userRes.dto';
import { LoginReqDto } from './dto/loginReq.dto';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Post')
@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
  ) {}

  @ApiOperation({
    summary: '회원가입',
    description: '회원 가입 후 응답 헤더에 JWT 추가',
  })
  @Post('register')
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201, type: UserResDto })
  @UsePipes(new ValidationPipe())
  async register(@Body() createUserDto: CreateUserReqDto, @Res() res: Response): Promise<void> {
    const user = await this.userService.register(createUserDto);
    const jwt = this.authService.generateJWT(user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.CREATED).json(user);
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
    res.status(HttpStatus.OK).json({ message: 'Login successful' });
    return;
  }
}
