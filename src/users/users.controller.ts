import { Controller, Get, Put, Patch, Delete, Body, UseGuards, Request, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AccountDeletionGuard } from '../common/guards/account-deletion.guard.js';
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
        const { applications, applicantProfile, ...cleanUser } = user as any;
        return {
            ...cleanUser,
            ...(applicantProfile || {})
        };
    }

    @UseGuards(JwtAuthGuard, AccountDeletionGuard)
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
        if (body.experience !== undefined) updateData.experienceYears = Number(body.experience);
        if (body.experiences !== undefined) updateData.experiences = body.experiences;
        if (body.educations !== undefined) updateData.educations = body.educations;
        if (body.portfolios !== undefined) updateData.portfolios = body.portfolios;
        if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;
        if (body.languages !== undefined) updateData.languages = body.languages;
        if (body.services !== undefined) updateData.services = body.services;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.themePreference !== undefined) updateData.themePreference = body.themePreference;
        if (body.languagePreference !== undefined) updateData.languagePreference = body.languagePreference;
        if (body.banner_url !== undefined) updateData.banner_url = body.banner_url;

        const updatedUser = await this.usersService.update(userId, updateData);
        const { access_token } = await this.authService.refreshUserToken(userId);
        
        // Exclude relations to avoid circular reference issues in serialization
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { applications, applicantProfile, ...cleanUser } = updatedUser as any;
        
        return {
            ...cleanUser,
            ...(applicantProfile || {}),
            access_token
        };
    }

    @UseGuards(JwtAuthGuard, AccountDeletionGuard)
    @Patch('me/theme')
    async updateTheme(@Request() req, @Body() body: { theme: 'light' | 'dark' }) {
        const userId = req.user.sub;
        const theme = body.theme;

        if (!theme || !['light', 'dark'].includes(theme)) {
            throw new BadRequestException('Theme must be "light" or "dark"');
        }

        await this.usersService.update(userId, { themePreference: theme });
        return { message: 'Theme updated', theme };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/language')
    async updateLanguage(@Request() req, @Body() body: { language: 'ar' | 'en' }) {
        const userId = req.user.sub;
        const language = body.language;

        if (!language || !['ar', 'en'].includes(language)) {
            throw new BadRequestException('Language must be "ar" or "en"');
        }

        await this.usersService.update(userId, { languagePreference: language });
        return { message: 'Language updated', language };
    }

    @UseGuards(JwtAuthGuard, AccountDeletionGuard)
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

    @UseGuards(JwtAuthGuard, AccountDeletionGuard)
    @Delete('me')
    async deleteAccount(@Request() req) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        if (user.deletionRequestedAt) {
            return { message: 'Account deletion already scheduled', deletionRequestedAt: user.deletionRequestedAt };
        }

        // Schedule deletion in 7 days — don't deactivate yet
        await this.usersService.update(userId, {
            deletionRequestedAt: new Date(),
        });

        const deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() + 7);

        return {
            message: 'Account scheduled for deletion. You have 7 days to cancel.',
            deletionRequestedAt: new Date(),
            permanentDeleteAt: deleteDate,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/cancel-deletion')
    async cancelDeletion(@Request() req) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        if (!user.deletionRequestedAt) {
            return { message: 'No deletion request found' };
        }

        await this.usersService.update(userId, {
            deletionRequestedAt: null,
            isActive: true,
        });

        return { message: 'Account deletion cancelled successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/deletion-status')
    async getDeletionStatus(@Request() req) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        if (!user.deletionRequestedAt) {
            return { scheduled: false };
        }

        const deleteDate = new Date(user.deletionRequestedAt);
        deleteDate.setDate(deleteDate.getDate() + 7);
        const daysLeft = Math.max(0, Math.ceil((deleteDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        return {
            scheduled: true,
            deletionRequestedAt: user.deletionRequestedAt,
            permanentDeleteAt: deleteDate,
            daysLeft,
        };
    }
}

