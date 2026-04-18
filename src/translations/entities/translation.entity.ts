import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'translations', schema: 'ptj' })
export class Translation {
  @PrimaryGeneratedColumn({ name: 'translation_id' })
  translationId: number;

  @Column({ name: 'translation_key', unique: true, nullable: true })
  translationKey: string;

  @Column({ type: 'text' })
  en: string;

  @Column({ type: 'text' })
  ar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
