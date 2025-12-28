import { Controller, Delete, Get, UseGuards, Req, Patch, Body,Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { use } from 'passport';


@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
 private readonly logger = new Logger('KeepAlive');

  @Get('test')
  test() {
    this.logger.log(`Ping received at: ${new Date().toISOString()}`);
    return { 
      message: 'okay',
      timestamp: new Date().toISOString() 
    };
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return this.usersService.userDetails(req.user.userId);
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  editProfile(@Req() req:any, @Body("userName") userName:string){
    return this.usersService.updateUser(req.user.userId,userName);
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  deleteMe(@Req() req: any) {
    return this.usersService.deleteUser(req.user.userId);
  }
  @UseGuards(AuthGuard('jwt'))
@Patch('updatePassword')
async changePassword(@Req() req, @Body("currentPassword") currentPassword:string,@Body("newPassword") newPassword:string) {
  try {
    return await this.usersService.updatePassword(req.user.userId, currentPassword, newPassword);
  } catch (error) {
    throw new Error(error.message);
  }
}
@UseGuards(AuthGuard('jwt'))
@Get('stats')
async getArtistStats(@Req() req) {
  try {
    return await this.usersService.getArtistDashboardData(req.user.userId);
  } catch (error) {
    throw new Error(error.message);
  }
   
}
@UseGuards(AuthGuard('jwt'))
@Get('growth')
async getArtistgrowth(@Req() req) {
    try {
      return await this.usersService.getArtistGrowth(req.user.userId);
    } catch (error) {
      throw new Error(error.message);
    }  
}
}
