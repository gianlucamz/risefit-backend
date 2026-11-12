import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { loginSchema } from './dto/login.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthGuard } from './guards/auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    nome: string;
    cargo: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
    };

    response.cookie('token', result.token, cookieOptions);
    response.cookie('auth_token', result.token, cookieOptions);

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    const cookieOptions = {
      path: '/',
    };

    response.clearCookie('token', cookieOptions);
    response.clearCookie('auth_token', cookieOptions);
    response.clearCookie('session', cookieOptions);

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.sub);
  }
}
