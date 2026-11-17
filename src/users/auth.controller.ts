import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.usersService.login(dto);
  }
}
