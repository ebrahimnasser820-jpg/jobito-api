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
}

@Entity({ schema: 'ptj', name: 'images' })
export class Image {
    @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
    imageId: string;

    @Column({ name: 'entity_type', type: 'enum', enum: ImageEntityType, enumName: 'ptj_image_entity' })
    entityType: ImageEntityType;

    @Column({ name: 'entity_id', type: 'text' })
    entityId: string;

    @Column({ name: 'image_type', type: 'enum', enum: ImageType, enumName: 'ptj_image_type', default: ImageType.GALLERY })
    imageType: ImageType;

    @Column({ name: 'image_url', type: 'text' })
    imageUrl: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize: number;

    @Column({ name: 'alt_text', type: 'text', nullable: true })
    altText: string;

    @Column({ name: 'is_primary', default: false })
    isPrimary: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
