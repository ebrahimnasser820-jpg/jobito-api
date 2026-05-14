import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoCompanyProfile } from './schemas/mongo-company-profile.schema.js';

@Injectable()
export class MongoCompanyProfileService {
    private readonly logger = new Logger(MongoCompanyProfileService.name);

    constructor(
        @InjectModel(MongoCompanyProfile.name)
        private readonly companyModel: Model<MongoCompanyProfile>,
    ) {}

    async ensureCompanyProfile(companyData: {
        companyId: string | number;
        name: string;
        contactEmail: string;
        logoUrl?: string | null;
        description?: string | null;
        address?: string | null;
        phone?: string | null;
        industry?: string | null;
        classification?: string | null;
        website?: string | null;
        verificationStatus?: string;
        isActive?: boolean;
    }): Promise<MongoCompanyProfile> {
        try {
            const companyIdStr = String(companyData.companyId);
            const existing = await this.companyModel.findOne({ companyId: companyIdStr });

            if (!existing) {
                const newProfile = new this.companyModel({
                    companyId: companyIdStr,
                    name: companyData.name,
                    contactEmail: companyData.contactEmail,
                    logoUrl: companyData.logoUrl || null,
                    description: companyData.description || null,
                    address: companyData.address || null,
                    phone: companyData.phone || null,
                    industry: companyData.industry || null,
                    classification: companyData.classification || null,
                    website: companyData.website || null,
                    verificationStatus: companyData.verificationStatus || 'PENDING',
                    isActive: companyData.isActive ?? true,
                    metadata: {},
                });

                const saved = await newProfile.save();
                this.logger.log(`✅ Created MongoDB company profile for ${companyData.name} (${companyIdStr})`);
                return saved;
            }

            const updates: Record<string, any> = {};
            if (companyData.name && companyData.name !== existing.name) updates.name = companyData.name;
            if (companyData.contactEmail && companyData.contactEmail !== existing.contactEmail) updates.contactEmail = companyData.contactEmail;
            if (companyData.logoUrl !== undefined && companyData.logoUrl !== existing.logoUrl) updates.logoUrl = companyData.logoUrl;
            if (companyData.description !== undefined && companyData.description !== existing.description) updates.description = companyData.description;
            if (companyData.address !== undefined && companyData.address !== existing.address) updates.address = companyData.address;
            if (companyData.phone !== undefined && companyData.phone !== existing.phone) updates.phone = companyData.phone;
            if (companyData.verificationStatus && companyData.verificationStatus !== existing.verificationStatus) updates.verificationStatus = companyData.verificationStatus;
            if (companyData.isActive !== undefined && companyData.isActive !== existing.isActive) updates.isActive = companyData.isActive;

            if (Object.keys(updates).length > 0) {
                await this.companyModel.updateOne({ companyId: companyIdStr }, { $set: updates });
                this.logger.log(`🔄 Updated MongoDB company profile for ${companyData.name}`);
            }

            return (await this.companyModel.findOne({ companyId: companyIdStr }))!;
        } catch (error) {
            this.logger.error(`❌ Failed to sync MongoDB company profile: ${error.message}`);
            throw error;
        }
    }

    async updateLogo(companyId: string | number, logoUrl: string | null): Promise<void> {
        await this.companyModel.updateOne({ companyId: String(companyId) }, { $set: { logoUrl } });
    }
}
