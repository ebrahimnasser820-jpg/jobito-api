import { Controller, Get, Put, Delete, Body, UseGuards, Request, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { AuthService } from '../auth/auth.service.js';
import * as bcrypt from 'bcryptjs';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    // Returns all users for internal testing/Postman
    const users = (await this.usersService.findAll()) as any[];
    // Remove circular refs/large relations
    return users.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { applications, ...clean } = u;
      return clean;
    });
  }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) return null;
        
        // Exclude relations and return a plain object to prevent circular serialization crashes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { applications, ...cleanUser } = user as any;
        return cleanUser;
    }

    @UseGuards(JwtAuthGuard)
    @Put('me')
    async updateProfile(@Request() req, @Body() body: any) {
        const userId = req.user.sub;

        // Extract only allowed fields
        const updateData: any = {};
        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.full_name !== undefined) updateData.fullName = body.full_name; // Backward compatibility
        if (body.email !== undefined) updateData.email = body.email;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.notificationPreferences !== undefined) {
            updateData.notificationPreferences = body.notificationPreferences;
        }
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.avatar !== undefined) updateData.avatarUrl = body.avatar; // Handle both aliases
        if (body.skills !== undefined) updateData.skills = body.skills;
        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.classification !== undefined) updateData.classification = body.classification;
        if (body.dob !== undefined) updateData.dob = body.dob === "" ? null : body.dob;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.experience !== undefined) updateData.experience = Number(body.experience);
        if (body.experiences !== undefined) updateData.experiences = body.experiences;
        if (body.educations !== undefined) updateData.educations = body.educations;
        if (body.portfolios !== undefined) updateData.portfolios = body.portfolios;
        if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;
        if (body.languages !== undefined) updateData.languages = body.languages;
        if (body.location !== undefined) updateData.location = body.location;

        const updatedUser = await this.usersService.update(userId, updateData);
        const { access_token } = await this.authService.refreshUserToken(userId);
        
        // Exclude relations to avoid circular reference issues in serialization
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { applications, ...cleanUser } = updatedUser as any;
        
        return {
            ...cleanUser,
            access_token
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put('me/password')
    async updatePassword(@Request() req, @Body() body: any) {
        const userId = req.user.sub;
        const { oldPassword, newPassword } = body;

        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        // Make sure user is not Google-only (i.e. has a password)
        if (!user.passwordHash) {
            throw new BadRequestException('This account was created via Google and has no password. You cannot change it here.');
        }

        console.log(`🔐 DEBUG updatePassword: userId=${userId}`);
        console.log(`🔐 body keys: ${Object.keys(body)}`);
        console.log(`🔐 oldPassword type: ${typeof oldPassword}, length: ${oldPassword?.length}`);
        console.log(`🔐 user has hash: ${!!user.passwordHash}`);
        
        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        console.log(`🔐 isPasswordValid: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid old password.');
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(userId, { passwordHash: hash });

        return { message: 'Password updated successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    async deleteAccount(@Request() req) {
        const userId = req.user.sub;
        // Soft delete
        await this.usersService.update(userId, { isActive: false });
        return { message: 'Account deactivated successfully' };
    }
}
