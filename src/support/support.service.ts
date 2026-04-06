import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelpCategory } from './help-category.entity.js';
import { HelpArticle } from './help-article.entity.js';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(HelpCategory)
    private categoryRepo: Repository<HelpCategory>,
    @InjectRepository(HelpArticle)
    private articleRepo: Repository<HelpArticle>,
  ) {}

  async findAllCategories() {
    return this.categoryRepo.find({
      relations: ['articles'],
    });
  }

  async findArticlesByCategory(categoryId: number) {
    return this.articleRepo.find({
      where: { categoryId },
    });
  }

  async findArticleById(articleId: number) {
    return this.articleRepo.findOne({
      where: { articleId },
      relations: ['category'],
    });
  }

  async searchArticles(query: string) {
    return this.articleRepo
      .createQueryBuilder('article')
      .where('LOWER(article.title) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(article.content) LIKE LOWER(:query)', { query: `%${query}%` })
      .getMany();
  }
}
