import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'translations', schema: 'ptj' })
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'translation_key', unique: true })
  translationKey: string;

  @Column({ type: 'text' })
  en: string;

  @Column({ type: 'text' })
  ar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
