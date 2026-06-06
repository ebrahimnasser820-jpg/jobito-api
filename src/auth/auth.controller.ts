import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ImagesService } from '../images/images.service.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendCodeDto } from './dto/resend-code.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

import * as fs from 'fs';

const storage = memoryStorage();

const fileFilterConfig = (_req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|jpg|jpeg|png|heic|heif|webp)$/i)) {
    return cb(new BadRequestException('Only PDF, Word, or Image documents are allowed'), false);
  }
  cb(null, true);
};

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private imagesService: ImagesService
  ) { }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Req() req: any) {
    return this.authService.refreshUserToken(req.user.sub);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: any) {
    return this.authService.refreshUserToken(req.user.sub);
  }


  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file', { storage, fileFilter: fileFilterConfig }))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB limit for images/PDFs
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.imagesService.uploadDocument(file);
    return {
      message: 'File uploaded successfully',
      url,
    };
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyEmailDto) {
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

  @Post('verify-firebase-phone')
  verifyFirebasePhone(@Body() body: { email: string, firebaseToken: string }) {
    return this.authService.verifyFirebasePhoneToken(body.email, body.firebaseToken);
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
