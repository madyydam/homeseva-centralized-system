import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type { SignInRequest } from '@homeseva/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @HttpCode(200)
  async signIn(
    @Body() body: SignInRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(body, res);
  }

  @Post('signout')
  @HttpCode(200)
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(process.env['AUTH_COOKIE_NAME'] ?? 'homeseva_session');
    return { success: true };
  }
}

