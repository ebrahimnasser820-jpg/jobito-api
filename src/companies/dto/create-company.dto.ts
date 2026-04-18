import { IsNotEmpty, IsOptional, IsEmail, IsString } from 'class-validator';

export class CreateCompanyDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameEn?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    descriptionEn?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    employees?: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    classification?: string;

    @IsOptional()
    @IsString()
    foundedDay?: string;

    @IsOptional()
    @IsString()
    foundedMonth?: string;

    @IsOptional()
    @IsString()
    foundedYear?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    crDocumentUrl?: string;

    @IsOptional()
    socialLinks?: any;

    @IsOptional()
    benefits?: any;

    @IsOptional()
    techStack?: any;

    @IsOptional()
    locationTags?: any;

    @IsOptional()
    @IsString()
    verificationStatus?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    officePhoto1Url?: string;

    @IsOptional()
    @IsString()
    officePhoto2Url?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @IsOptional()
    @IsString()
    officialNationalId?: string;
}
