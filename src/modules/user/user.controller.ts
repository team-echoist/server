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
import { generateJWT } from '../../common/guards/jwt.service';
import { Response } from 'express';
import { UserResDto } from './dto/userRes.dto';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Post')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '회원가입',
  })
  @Post('register')
  @ApiBody({ type: CreateUserReqDto })
  @ApiResponse({ status: 201, type: UserResDto })
  @UsePipes(new ValidationPipe())
  async register(@Body() createUserDto: CreateUserReqDto, @Res() res: Response): Promise<void> {
    const user = await this.userService.register(createUserDto);
    const jwt = generateJWT(user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.CREATED).json(user);
    return;
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: RequestWithUser, @Res() res: Response) {
    const jwt = generateJWT(req.user);

    res.setHeader('Authorization', `Bearer ${jwt}`);
    res.status(HttpStatus.OK).json({ message: 'Login successful' });
    return;
  }
}
