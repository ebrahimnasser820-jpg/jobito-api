import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
} from 'typeorm';
import { Job } from './job.entity.js';

@Entity({ schema: 'ptj', name: 'categories' })
export class Category {
    @PrimaryGeneratedColumn({ name: 'category_id', type: 'bigint' })
    categoryId: number;

    @Column({ length: 150, unique: true })
    name: string;

    @Column({ name: 'name_en', length: 150, nullable: true })
    nameEn: string;


    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'description_en', type: 'text', nullable: true })
    descriptionEn: string;


    @OneToMany(() => Job, (job) => job.category)
    jobs: Job[];
}
