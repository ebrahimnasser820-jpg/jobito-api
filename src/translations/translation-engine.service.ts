import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import Redis from 'ioredis';
import { Translation } from './entities/translation.entity.js';

@Injectable()
export class TranslationEngineService implements OnModuleInit {
  private readonly baseUrl = 'http://127.0.0.1:5001';
  private readonly chunkSize = 20;
  private redis: Redis;

  constructor(
    @InjectRepository(Translation)
    private translationsRepository: Repository<Translation>,
  ) {}

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const portStr = process.env.REDIS_PORT || '6379';
    const port = parseInt(portStr, 10) || 6379;

    // Initialize Redis connection
    this.redis = new Redis({ host, port });
    
    this.redis.on('error', (err) => {
      console.warn('[Redis Error]: Translation cache may not be available.', err.message);
    });
  }

  /**
   * Translates a batch of texts using 3-layer caching: Redis -> Postgres -> Python Service
   */
  async translateBatch(texts: string[], targetLang: 'ar' | 'en'): Promise<string[]> {
    if (!texts || texts.length === 0) return [];

    const results: string[] = new Array(texts.length);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    // 1. Layer 1: Redis Lookup (Fastest)
    try {
      if (this.redis) {
        const redisKeys = texts.map(t => `tr:${targetLang}:${t}`);
        const cached = await this.redis.mget(...redisKeys);
        
        if (cached) {
          cached.forEach((val, i) => {
            if (val) {
              results[i] = val;
            } else {
              missingIndices.push(i);
              missingTexts.push(texts[i]);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Redis Lookup Error]:', err.message);
    }

    if (missingTexts.length === 0) return results;

    // 2. Layer 2: Postgres Lookup (Persistent Cache)
    const stillMissingTexts: string[] = [];
    const stillMissingIndices: number[] = [];

    try {
      for (const [i, text] of missingTexts.entries()) {
        const dbRecord = await this.translationsRepository.findOne({
          where: [
            { en: text },
            { ar: text }, // Check both to handle bi-directional dynamic lookups
            { translationKey: text }
          ]
        });

        if (dbRecord) {
          const translated = targetLang === 'ar' ? dbRecord.ar : dbRecord.en;
          const origIdx = missingIndices[i];
          results[origIdx] = translated;
          
          // Populate Redis for next time
          if (this.redis) {
            await this.redis.setex(`tr:${targetLang}:${text}`, 86400 * 7, translated);
          }
        } else {
          stillMissingTexts.push(text);
          stillMissingIndices.push(missingIndices[i]);
        }
      }
    } catch (err) {
      console.warn('[Postgres Lookup Error]:', err.message);
    }

    if (stillMissingTexts.length === 0) return results;

    // 3. Layer 3: Python Microservice (Source)
    const chunks = this.createChunks(stillMissingTexts, this.chunkSize);
    
    try {
      const chunkResults: string[][] = [];
      for (const chunk of chunks) {
        const result = await this.translateChunk(chunk, targetLang);
        chunkResults.push(result);
        // Small delay between chunks to let Google Translate breathe
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const flattenedResults = chunkResults.flat();

      // Synchronize results to Postgres and Redis
      for (let i = 0; i < flattenedResults.length; i++) {
        const translated = flattenedResults[i];
        const original = stillMissingTexts[i];
        const origIdx = stillMissingIndices[i];
        results[origIdx] = translated;

        // Save to Postgres asynchronously
        this.saveToPostgres(original, translated, targetLang).catch(() => {});

        // Save to Redis
        if (this.redis) {
          this.redis.setex(`tr:${targetLang}:${original}`, 86400 * 7, translated).catch(() => {});
        }
      }

      return results;
    } catch (err) {
      console.error('[Translation Engine Error]:', err.message);
      return texts;
    }
  }

  /**
   * Saves a new translation to the main database with robust existence checks
   */
  private async saveToPostgres(original: string, translated: string, targetLang: 'ar' | 'en') {
    try {
      // Find if we already have this text in EITHER column
      const existing = await this.translationsRepository.findOne({ 
        where: [
          { en: original },
          { ar: original }
        ]
      });
      
      if (existing) {
        let changed = false;
        if (targetLang === 'ar' && !existing.ar) {
          existing.ar = translated;
          changed = true;
        } else if (targetLang === 'en' && !existing.en) {
          existing.en = translated;
          changed = true;
        }
        if (changed) {
          await this.translationsRepository.save(existing);
        }
      } else {
        const newTrans = new Translation();
        // Generate a deterministic key to avoid duplicates across parallel requests
        const hash = Buffer.from(original).toString('hex').slice(0, 16);
        newTrans.translationKey = `auto.${hash}`;
        newTrans.en = targetLang === 'en' ? translated : original;
        newTrans.ar = targetLang === 'ar' ? translated : original; // If incoming was Arabic and target is Arabic? No, logic below.
        
        // Correct bi-directional mapping
        const isArabicText = /[\u0600-\u06FF]/.test(original);
        if (isArabicText) {
          newTrans.ar = original;
          newTrans.en = targetLang === 'en' ? translated : '';
        } else {
          newTrans.en = original;
          newTrans.ar = targetLang === 'ar' ? translated : '';
        }

        await this.translationsRepository.save(newTrans);
      }
    } catch (err) {
      // Unique constraint violation might still happen in race conditions, ignore it safely
      if (!err.message.includes('duplicate key')) {
        console.error('Error in saveToPostgres:', err.message);
      }
    }
  }

  private createChunks(array: string[], size: number): string[][] {
    const results: string[][] = [];
    for (let i = 0; i < array.length; i += size) {
      results.push(array.slice(i, i + size));
    }
    return results;
  }

  private async translateChunk(texts: string[], targetLang: string): Promise<string[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/translate`, {
        texts,
        target_lang: targetLang,
        source_lang: 'auto',
      });

      return response.data.translated_texts || [];
    } catch (err) {
      console.error('[Chunk Translation Error]:', err.message);
      return texts;
    }
  }
}
