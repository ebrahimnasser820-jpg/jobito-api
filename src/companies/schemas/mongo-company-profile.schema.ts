import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB Company Profile
 * 
 * Stores a dedicated record for each company in MongoDB.
 * Automatically created/updated when a company is registered, approved, or updated.
 */
@Schema({ timestamps: true, collection: 'company_profiles' })
export class MongoCompanyProfile extends Document {
    @Prop({ required: true, unique: true, index: true })
    companyId: string; // The bigint ID from Postgres as a string

    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: true, index: true, type: String })
    contactEmail: string;

    @Prop({ type: String, default: null })
    logoUrl: string | null;

    @Prop({ type: String, default: null })
    description: string | null;

    @Prop({ type: String, default: null })
    address: string | null;

    @Prop({ type: String, default: null })
    phone: string | null;

    @Prop({ type: String, default: null })
    industry: string | null;

    @Prop({ type: String, default: null })
    classification: string | null;

    @Prop({ type: String, default: null })
    website: string | null;

    @Prop({ type: String, default: 'PENDING' })
    verificationStatus: string;

    /** Flexible metadata space for future features */
    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;
}

export const MongoCompanyProfileSchema = SchemaFactory.createForClass(MongoCompanyProfile);
