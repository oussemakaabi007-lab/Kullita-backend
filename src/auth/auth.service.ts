import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from 'src/common/database/database.service';
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService ,private db: DatabaseService,private mailerService: MailerService) {}

  async register(email:string,username: string, password: string, role: 'listener' | 'artist') {
   return  await this.usersService.createUser(email,username, password, role);
    
  }

  async login(username: string, password: string) {
    const user = await this.usersService.validateUser(username, password);
    if (!user) throw new Error('Please check your username and password');
    return this.usersService.login(user);
  }
 async sendResetLink(email: string) {
    const userQuery = 'SELECT id, email FROM "User" WHERE email = $1';
    const userRes = await this.db.query(userQuery, [email]);
    const user = userRes.rows[0];
    if (!user) return { message: 'If this email exists, a link has been sent.' };
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 600000);
    const updateQuery = `
      UPDATE "User" 
      SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 
      WHERE id = $3
    `;
    await this.db.query(updateQuery, [token, expiry, user.id]);
    const url = `http://localhost:3000/resetpassword?token=${token}`;
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; background: #121212; color: white; padding: 20px; border-radius: 10px;">
          <h2>Password Reset</h2>
          <p>You requested a password reset for your Kullita account.</p>
          <p>Click the button below to set a new password. This link is valid for 10 minutes.</p>
          <a href="${url}" style="background: #be00b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
      `,
    });

    return { message: 'Reset link sent successfully.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const findQuery = `
      SELECT id FROM "User" 
      WHERE "resetPasswordToken" = $1 
      AND "resetPasswordExpires" > NOW()
    `;
    const res = await this.db.query(findQuery, [token]);
    const user = res.rows[0];

    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `
      UPDATE "User" 
      SET "password" = $1, 
          "resetPasswordToken" = NULL, 
          "resetPasswordExpires" = NULL 
      WHERE id = $2
    `;
    await this.db.query(updateQuery, [hashedPassword, user.id]);

    return { message: 'Password updated successfully' };
  }
  async sendWelcomeEmail(userEmail: string, userName: string) {
    await this.mailerService.sendMail({
      to: userEmail,
      subject: 'Welcome to Kullita! 🎵',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #be00b8;">Hi ${userName}!</h1>
          <p>We are happy to get you with us.</p>
          <p>We wish you an amazing experience!</p>
          <br />
          <p>Keep kulliting,</p>
          <p>The Kullita Team</p>
        </div>
      `,
    });
  }
  
}
