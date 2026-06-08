import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image, ImageEntityType, ImageType } from './image.entity.js';
import { CreateImageDto } from './dto/create-image.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private repo: Repository<Image>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateImageDto, file: Express.Multer.File): Promise<Image> {
    if (dto.is_primary) {
      await this.repo.update(
        {
          entityType: dto.entity_type as any,
          entityId: dto.entity_id as any,
          isPrimary: true,
        },
        { isPrimary: false },
      );
    }

    const image = this.repo.create({
      entityType: dto.entity_type as any,
      entityId: dto.entity_id as any,
      imageType: (dto.image_type as any) || ImageType.GALLERY,
      data: file.buffer,
      mimeType: file.mimetype,
      fileSize: file.size,
      altText: dto.alt_text || undefined,
      isPrimary: !!dto.is_primary,
      imageUrl: '', // placeholder
    });

    const savedImage = await this.repo.save(image);
    savedImage.imageUrl = `/images/data/${savedImage.imageId}`;
    return this.repo.save(savedImage);
  }

  async findById(imageId: string): Promise<Image | null> {
    return this.repo.findOne({ where: { imageId } });
  }

  async uploadDocument(file: Express.Multer.File): Promise<string> {
    const doc = this.repo.create({
      imageType: ImageType.DOCUMENT,
      data: file.buffer,
      mimeType: file.mimetype,
      fileSize: file.size,
      imageUrl: '', // placeholder
    });

    const saved = await this.repo.save(doc);
    saved.imageUrl = `/images/data/${saved.imageId}`;
    await this.repo.save(saved);

    return saved.imageUrl;
  }

  /** Get all images for an entity */
  findByEntity(entityType: ImageEntityType, entityId: string) {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Get user profile image */
  async getProfileImage(userId: string): Promise<Image | null> {
    return this.repo.findOne({
      where: {
        entityType: ImageEntityType.USER,
        entityId: userId,
        imageType: ImageType.PROFILE,
        isPrimary: true,
      },
    });
  }

  /** Upload / replace user profile image */
  async setProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Image> {
    // Remove old profile image
    const old = await this.repo.findOne({
      where: {
        entityType: ImageEntityType.USER,
        entityId: userId,
        imageType: ImageType.PROFILE,
        isPrimary: true,
      },
    });

    if (old) {
      await this.repo.remove(old);
    }

    const image = this.repo.create({
      entityType: ImageEntityType.USER,
      entityId: userId,
      imageType: ImageType.PROFILE,
      data: file.buffer,
      mimeType: file.mimetype,
      fileSize: file.size,
      isPrimary: true,
      imageUrl: '', // placeholder
    });

    let savedImage = await this.repo.save(image);
    savedImage.imageUrl = `/images/data/${savedImage.imageId}`;
    savedImage = await this.repo.save(savedImage);

    // Sync with users table
    await this.usersService.update(userId, { avatarUrl: savedImage.imageUrl });

    return savedImage;
  }

  /** Upload / replace user banner image */
  async setBannerImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Image> {
    // Remove old banner image
    const old = await this.repo.findOne({
      where: {
        entityType: ImageEntityType.USER,
        entityId: userId,
        imageType: ImageType.COVER,
        isPrimary: true,
      },
    });

    if (old) {
      await this.repo.remove(old);
    }

    const image = this.repo.create({
      entityType: ImageEntityType.USER,
      entityId: userId,
      imageType: ImageType.COVER,
      data: file.buffer,
      mimeType: file.mimetype,
      fileSize: file.size,
      isPrimary: true,
      imageUrl: '', // placeholder
    });

    let savedImage = await this.repo.save(image);
    savedImage.imageUrl = `/images/data/${savedImage.imageId}`;
    savedImage = await this.repo.save(savedImage);

    // Sync with users table (banner_url)
    await this.usersService.update(userId, { banner_url: savedImage.imageUrl });

    return savedImage;
  }

  /** Delete image with ownership check */
  async remove(imageId: string, userId: string): Promise<void> {
    const image = await this.repo.findOne({ where: { imageId } });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Ownership check based on entity type
    switch (image.entityType) {
      case ImageEntityType.USER:
        if (image.entityId !== userId) {
          throw new ForbiddenException('You can only delete your own images');
        }
        break;
      case ImageEntityType.COMPANY:
      case ImageEntityType.JOB:
      case ImageEntityType.GROUP:
        throw new ForbiddenException('Contact admin to delete this image');
    }

    await this.repo.remove(image);
  }
}
