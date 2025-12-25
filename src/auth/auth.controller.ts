import { Controller, Post, Body , Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as e from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

 @Post('register')
async register(@Body() body: any) {
  const { email, name, password, role } = body;
  return this.authService.register(email, name, password, role);
}

  @Post('login')
async login(
  @Body('username') username: string, 
  @Body('password') password: string,
  @Res() res: e.Response
) {
  // 1. Get the token/user from your service
  const result = await this.authService.login(username, password);

  // 2. Set the cookie
  res.cookie('token', result.access_token, {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
    sameSite: 'lax',
    path: '/',
    // This makes the cookie persistent (7 days)
    maxAge: 365 * 24 * 60 * 60 * 1000, 
  });

  // 3. Send the response
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
