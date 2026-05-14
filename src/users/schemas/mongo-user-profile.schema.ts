import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB User Profile
 * 
 * Stores a dedicated record for each user in MongoDB.
 * This is automatically created/updated on login or registration,
 * and synced whenever the user updates their profile picture or basic info.
 * 
 * This document serves as the user's "data space" in MongoDB,
 * allowing future features (preferences, chat metadata, etc.) to be stored here.
 */
@Schema({ timestamps: true, collection: 'user_profiles' })
export class MongoUserProfile extends Document {
    @Prop({ required: true, unique: true, index: true })
    userId: string;

    @Prop({ required: true })
    fullName: string;

    @Prop({ type: String })
    email: string;

    @Prop({ type: String, default: null })
    avatarUrl: string | null;

    @Prop({ type: String, default: null })
    bannerUrl: string | null;

    @Prop({ type: String, default: 'user' })
    role: string;

    @Prop({ type: String, default: null })
    phone: string | null;

    @Prop({ type: String, default: null })
    location: string | null;

    @Prop({ type: String, default: null })
    bio: string | null;

    @Prop({ type: [String], default: [] })
    skills: string[];

    @Prop({ type: [String], default: [] })
    services: string[];

    @Prop({ type: String, default: null })
    classification: string | null;

    /** User's preferred theme */
    @Prop({ type: String, default: 'light' })
    themePreference: string;

    /** User's preferred language */
    @Prop({ type: String, default: 'en' })
    languagePreference: string;

    /** Flexible metadata space for future features */
    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop({ type: Date })
    lastLoginAt: Date;
}

export const MongoUserProfileSchema = SchemaFactory.createForClass(MongoUserProfile);
