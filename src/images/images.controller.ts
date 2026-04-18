import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ImagesService } from './images.service.js';
import { CreateImageDto } from './dto/create-image.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { ImageEntityType } from './image.entity.js';

const storage = diskStorage({
    destination: './uploads/images',
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// Fix issue #7: allow images AND document files for resumes
const fileFilterConfig = (_req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        return cb(new BadRequestException('Only Images and PDF/Word documents are allowed'), false);
    }
    cb(null, true);
};

@Controller('images')
export class ImagesController {
    constructor(private imagesService: ImagesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { storage, fileFilter: fileFilterConfig }))
    upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: CreateImageDto,
    ) {
        return this.imagesService.create(dto, file);
    }

    /** GET /images/entity/:type/:id — list images for an entity */
    @Get('entity/:type/:id')
    findByEntity(
        @Param('type') type: ImageEntityType,
        @Param('id') id: string,
    ) {
        return this.imagesService.findByEntity(type, id);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { storage, fileFilter: fileFilterConfig }))
    setProfile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                ],
            }),
        )
        file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        return this.imagesService.setProfileImage(user.sub, file);
    }

    /** PUT /images/banner — upload/replace current user banner image */
    @Put('banner')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { storage, fileFilter: fileFilterConfig }))
    setBanner(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                ],
            }),
        )
        file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        return this.imagesService.setBannerImage(user.sub, file);
    }

    /** GET /images/profile/:userId — get user profile image */
    @Get('profile/:userId')
    async getProfile(@Param('userId') userId: string) {
        const image = await this.imagesService.getProfileImage(userId);
        if (!image) throw new NotFoundException('Profile image not found');
        return image;
    }

    /** DELETE /images/:imageId — delete image */
    @Delete(':imageId')
    @UseGuards(JwtAuthGuard)
    remove(@Param('imageId') imageId: string, @CurrentUser() user: any) {
        return this.imagesService.remove(imageId, user.sub);
    }
}
