import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './testimonial.entity.js';

@Injectable()
export class TestimonialsService {
    constructor(
        @InjectRepository(Testimonial)
        private repo: Repository<Testimonial>,
    ) { }

    /**
     * الـ featured testimonials اللي بتظهر في الصفحة الرئيسية
     * بترجع الـ user معاها (fullName, email) عشان الـ React component
     */
    getFeatured() {
        return this.repo.find({
            where: { isFeatured: true },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    findAll() {
        return this.repo.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    create(userId: string, body: string) {
        const testimonial = this.repo.create({ userId, body });
        return this.repo.save(testimonial);
    }
}
