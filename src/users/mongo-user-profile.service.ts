import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoUserProfile } from './schemas/mongo-user-profile.schema.js';

/**
 * Service responsible for managing user profiles in MongoDB.
 * 
 * This service ensures every user has a dedicated record in MongoDB.
 * It is called automatically during:
 *   - Login (email/password and Google)
 *   - Email verification (account activation)
 *   - Profile updates (avatar, name, etc.)
 * 
 * It does NOT create or modify chat conversations.
 */
@Injectable()
export class MongoUserProfileService {
    private readonly logger = new Logger(MongoUserProfileService.name);

    constructor(
        @InjectModel(MongoUserProfile.name)
        private readonly profileModel: Model<MongoUserProfile>,
    ) {}

    /**
     * Ensure a user has a MongoDB profile record.
     * - If the user doesn't exist → create a new document.
     * - If the user exists → update only the basic fields that may have changed.
     */
    async ensureUserProfile(userData: {
        userId: string;
        fullName: string;
        email?: string;
        avatarUrl?: string | null;
        bannerUrl?: string | null;
        role?: string;
        phone?: string | null;
        location?: string | null;
        bio?: string | null;
        skills?: string[];
        services?: string[];
        classification?: string | null;
        themePreference?: string;
        languagePreference?: string;
        isActive?: boolean;
    }): Promise<MongoUserProfile> {
        try {
            const existing = await this.profileModel.findOne({ userId: userData.userId });

            if (!existing) {
                // ─── Create new MongoDB profile ─────────────────────────
                const newProfile = new this.profileModel({
                    userId: userData.userId,
                    fullName: userData.fullName,
                    email: userData.email || '',
                    avatarUrl: userData.avatarUrl || null,
                    bannerUrl: userData.bannerUrl || null,
                    role: userData.role || 'user',
                    phone: userData.phone || null,
                    location: userData.location || null,
                    bio: userData.bio || null,
                    skills: userData.skills || [],
                    services: userData.services || [],
                    classification: userData.classification || null,
                    themePreference: userData.themePreference || 'light',
                    languagePreference: userData.languagePreference || 'en',
                    isActive: userData.isActive ?? true,
                    lastLoginAt: new Date(),
                    metadata: {},
                });

                const saved = await newProfile.save();
                this.logger.log(`✅ Created MongoDB profile for user ${userData.userId} (${userData.fullName})`);
                return saved;
            }

            // ─── Update existing profile (only changed basic fields) ────
            const updates: Record<string, any> = {
                lastLoginAt: new Date(),
            };

            // Only update fields that have actually changed
            if (userData.fullName && userData.fullName !== existing.fullName) {
                updates.fullName = userData.fullName;
            }
            if (userData.email && userData.email !== existing.email) {
                updates.email = userData.email;
            }
            if (userData.avatarUrl !== undefined && userData.avatarUrl !== existing.avatarUrl) {
                updates.avatarUrl = userData.avatarUrl;
            }
            if (userData.bannerUrl !== undefined && userData.bannerUrl !== existing.bannerUrl) {
                updates.bannerUrl = userData.bannerUrl;
            }
            if (userData.role && userData.role !== existing.role) {
                updates.role = userData.role;
            }
            if (userData.phone !== undefined && userData.phone !== existing.phone) {
                updates.phone = userData.phone;
            }
            if (userData.isActive !== undefined && userData.isActive !== existing.isActive) {
                updates.isActive = userData.isActive;
            }

            if (Object.keys(updates).length > 1) {
                // More than just lastLoginAt
                await this.profileModel.updateOne({ userId: userData.userId }, { $set: updates });
                this.logger.log(`🔄 Updated MongoDB profile for user ${userData.userId}`);
            } else {
                // Only lastLoginAt changed
                await this.profileModel.updateOne({ userId: userData.userId }, { $set: updates });
            }

            return (await this.profileModel.findOne({ userId: userData.userId }))!;
        } catch (error) {
            this.logger.error(`❌ Failed to ensure MongoDB profile for user ${userData.userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update the user's avatar URL in MongoDB.
     * Called when the user uploads/changes their profile picture.
     */
    async updateAvatar(userId: string, avatarUrl: string | null): Promise<void> {
        try {
            const result = await this.profileModel.updateOne(
                { userId },
                { $set: { avatarUrl } },
            );
            if (result.matchedCount > 0) {
                this.logger.log(`🖼️ Updated avatar in MongoDB for user ${userId}`);
            }
        } catch (error) {
            this.logger.warn(`⚠️ Failed to update avatar in MongoDB for user ${userId}: ${error.message}`);
        }
    }

    /**
     * Update the user's banner URL in MongoDB.
     */
    async updateBanner(userId: string, bannerUrl: string | null): Promise<void> {
        try {
            await this.profileModel.updateOne(
                { userId },
                { $set: { bannerUrl } },
            );
        } catch (error) {
            this.logger.warn(`⚠️ Failed to update banner in MongoDB for user ${userId}: ${error.message}`);
        }
    }

    /**
     * Update basic profile fields in MongoDB.
     * Called when the user updates their profile (name, bio, skills, etc.).
     */
    async updateProfile(userId: string, data: Partial<{
        fullName: string;
        avatarUrl: string | null;
        bannerUrl: string | null;
        phone: string | null;
        location: string | null;
        bio: string | null;
        skills: string[];
        services: string[];
        classification: string | null;
        themePreference: string;
        languagePreference: string;
    }>): Promise<void> {
        try {
            // Remove undefined fields
            const updates: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    updates[key] = value;
                }
            }

            if (Object.keys(updates).length === 0) return;

            const result = await this.profileModel.updateOne(
                { userId },
                { $set: updates },
            );
            if (result.matchedCount > 0) {
                this.logger.log(`📝 Updated MongoDB profile fields for user ${userId}`);
            }
        } catch (error) {
            this.logger.warn(`⚠️ Failed to update MongoDB profile for user ${userId}: ${error.message}`);
        }
    }

    /**
     * Get a user's MongoDB profile.
     */
    async getProfile(userId: string): Promise<MongoUserProfile | null> {
        return this.profileModel.findOne({ userId });
    }

    /**
     * Deactivate a user's MongoDB profile (on account deletion).
     */
    async deactivateProfile(userId: string): Promise<void> {
        await this.profileModel.updateOne(
            { userId },
            { $set: { isActive: false } },
        );
    }
}
