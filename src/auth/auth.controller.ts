import { Controller, Post, Body , Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as e from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

 @Post('register')
async register(@Body() body: any) {
  const { email, name, password, role } = body;
  const user= this.authService.register(email, name, password, role);
  this.authService.sendWelcomeEmail(email,name).catch(err => {
      console.error('Email failed to send:', err);
    });
  return user;
}

  @Post('login')
async login(
  @Body('username') username: string, 
  @Body('password') password: string,
  @Res() res: e.Response
) {
  const result = await this.authService.login(username, password);
  res.cookie('token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60 * 1000, 
  });
  return res.status(HttpStatus.OK).json({
    result
  });
}
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendResetLink(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const { token, password } = body;
    return this.authService.resetPassword(token, password);
  }
  @Post('logout')
  async logout(@Res() res: e.Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return res.status(HttpStatus.OK).json({
      message: 'Logged out successfully',
    });
  }
  
}
