import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { HelpArticle } from './help-article.entity.js';

@Entity({ schema: 'ptj', name: 'help_categories' })
export class HelpCategory {
  @PrimaryGeneratedColumn({ name: 'help_category_id', type: 'bigint' })
  helpCategoryId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_en', length: 100, nullable: true })
  nameEn: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @OneToMany(() => HelpArticle, (article) => article.category)
  articles: HelpArticle[];
}
