import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'ptj', name: 'features' })
export class Feature {
  @PrimaryGeneratedColumn({ name: 'feature_id' })
  featureId: number;

  @Column({ nullable: true })
  title: string;

  @Column({ name: 'title_en', nullable: true })
  titleEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  @Column({ nullable: true })
  icon: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
