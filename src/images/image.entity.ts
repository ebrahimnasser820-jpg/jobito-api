import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

export enum ImageEntityType {
    USER = 'user',
    COMPANY = 'company',
    JOB = 'job',
    GROUP = 'group',
}

export enum ImageType {
    PROFILE = 'profile',
    LOGO = 'logo',
    COVER = 'cover',
    GALLERY = 'gallery',
    PORTFOLIO = 'portfolio',
    DOCUMENT = 'document',
}

@Entity({ schema: 'ptj', name: 'images' })
export class Image {
    @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
    imageId: string;

    @Column({ name: 'entity_type', type: 'enum', enum: ImageEntityType, enumName: 'ptj_image_entity', nullable: true })
    entityType: ImageEntityType;

    @Column({ name: 'entity_id', type: 'text', nullable: true })
    entityId: string;

    @Column({ name: 'image_type', type: 'enum', enum: ImageType, enumName: 'ptj_image_type', default: ImageType.GALLERY })
    imageType: ImageType;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string;

    @Column({ name: 'file_data', type: 'bytea', nullable: true })
    data: Buffer;

    @Column({ name: 'mime_type', type: 'varchar', length: 50, nullable: true })
    mimeType: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize: number;

    @Column({ name: 'alt_text', type: 'text', nullable: true })
    altText: string;

    @Column({ name: 'is_primary', default: false })
    isPrimary: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
