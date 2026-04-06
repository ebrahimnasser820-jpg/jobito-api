import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { HelpCategory } from './help-category.entity.js';

@Entity({ schema: 'ptj', name: 'help_articles' })
export class HelpArticle {
  @PrimaryGeneratedColumn({ name: 'article_id', type: 'bigint' })
  articleId: number;

  @ManyToOne(() => HelpCategory, (category) => category.articles)
  @JoinColumn({ name: 'category_id' })
  category: HelpCategory;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'title_en', length: 255, nullable: true })
  titleEn: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'content_en', type: 'text', nullable: true })
  contentEn: string;

  @Column({ name: 'is_helpful_yes', default: 0 })
  isHelpfulYes: number;

  @Column({ name: 'is_helpful_no', default: 0 })
  isHelpfulNo: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
