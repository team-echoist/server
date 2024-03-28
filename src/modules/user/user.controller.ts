import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly authService: UserService) {}

  @Post('register')
  async register(@Body() createAuthDto: CreateUserDto) {
    return this.authService.register(createAuthDto);
  }
}
