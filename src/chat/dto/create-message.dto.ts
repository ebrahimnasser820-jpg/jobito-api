import { IsString, IsEnum, IsOptional, IsNotEmpty, IsUrl, Matches } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsOptional()
    clientId?: string;

    @IsEnum(['user', 'bot'])
    sender: 'user' | 'bot';

    @IsEnum(['text', 'image', 'audio', 'video'])
    type: 'text' | 'image' | 'audio' | 'video';

    @IsString()
    @IsOptional()
    content?: string;

    @IsOptional()
    @IsUrl(
        { protocols: ['https'], require_protocol: true },
        { message: 'mediaUrl must be a valid HTTPS URL' }
    )
    @Matches(/^(https:\/\/)(jobito-uploads\.s3\.amazonaws\.com|firebasestorage\.googleapis\.com)/, {
        message: 'mediaUrl must point to a trusted storage provider (S3 or Firebase)',
    })
    mediaUrl?: string;
}
