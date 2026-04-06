import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendCodeDto } from './dto/resend-code.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Req() req: any) {
    return this.authService.refreshUserToken(req.user.sub);
  }


  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Get('verify-link')
  async verifyEmailLink(
    @Query('email') email: string,
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    const success = await this.authService.verifyEmailLink(email, code);
    const frontendHost = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Redirect to login page with a success or error flag
    const redirectUrl = success 
      ? `${frontendHost}/user-information?verified=true`
      : `${frontendHost}/user-information?verified=false`;
      
    return res.redirect(redirectUrl);
  }

  @Post('resend-code')
  resendCode(@Body() body: ResendCodeDto) {
    return this.authService.resendCode(body.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.new_password);
  }

  @Post('reset-password-google')
  async resetPasswordGoogle(
    @Body() body: { googleToken: string; new_password: string },
  ) {
    return await this.authService.resetPasswordWithGoogle(
      body.googleToken,
      body.new_password,
    );
  }

  // ─── Google Auth ────────────────────────────────────────────────────────
  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    return this.authService.validateGoogleUser(token);
  }

  @Post('link-google')
  @UseGuards(JwtAuthGuard)
  async linkGoogle(@Body('googleToken') token: string, @Req() req: any) {
    return this.authService.linkGoogleAccount(req.user.sub, token);
  }
}
