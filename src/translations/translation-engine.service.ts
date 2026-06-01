import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Translation } from './entities/translation.entity.js';

@Injectable()
export class TranslationEngineService implements OnModuleInit {
  private readonly baseUrl = process.env.TRANSLATION_SERVICE_URL || 'https://translate-production-8b5c.up.railway.app';
  private readonly chunkSize = 20;

  constructor(
    @InjectRepository(Translation)
    private translationsRepository: Repository<Translation>,
  ) {}

  onModuleInit() {
  }

  /**
   * Translates a batch of texts using 2-layer caching: Postgres -> Python Service
   */
  async translateBatch(texts: string[], targetLang: 'ar' | 'en'): Promise<string[]> {
    if (!texts || texts.length === 0) return [];

    const results: string[] = new Array(texts.length);

    // 1. Layer 1: Postgres Lookup (Persistent Cache)
    const missingTexts: string[] = [];
    const missingIndices: number[] = [];

    try {
      for (const [i, text] of texts.entries()) {
        const dbRecord = await this.translationsRepository.findOne({
          where: [
            { en: text },
            { ar: text }, // Check both to handle bi-directional dynamic lookups
            { translationKey: text }
          ]
        });

        if (dbRecord) {
          const translated = targetLang === 'ar' ? dbRecord.ar : dbRecord.en;
          results[i] = translated;
        } else {
          missingTexts.push(text);
          missingIndices.push(i);
        }
      }
    } catch (err) {
      console.warn('[Postgres Lookup Error]:', err.message);
      // In case of error, assume all remaining are missing to try with Microservice
      for (let i = 0; i < texts.length; i++) {
        if (!results[i]) {
          missingTexts.push(texts[i]);
          missingIndices.push(i);
        }
      }
    }

    if (missingTexts.length === 0) return results;

    // 2. Layer 2: Python Microservice (Source)
    const chunks = this.createChunks(missingTexts, this.chunkSize);
    
    try {
      const chunkResults: string[][] = [];
      for (const chunk of chunks) {
        const result = await this.translateChunk(chunk, targetLang);
        chunkResults.push(result);
        // Small delay between chunks to let Google Translate breathe
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const flattenedResults = chunkResults.flat();

      // Synchronize results to Postgres
      for (let i = 0; i < flattenedResults.length; i++) {
        const translated = flattenedResults[i];
        const original = missingTexts[i];
        const origIdx = missingIndices[i];
        results[origIdx] = translated;

        // Save to Postgres asynchronously
        this.saveToPostgres(original, translated, targetLang).catch(() => {});
      }

      return results;
    } catch (err) {
      console.error('[Translation Engine Error]:', err.message);
      // Fallback: return originals for anything that failed
      for (let i = 0; i < missingTexts.length; i++) {
        const origIdx = missingIndices[i];
        if (!results[origIdx]) {
          results[origIdx] = missingTexts[i];
        }
      }
      return results;
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
      }, { timeout: 15000 });

      const translatedTexts: string[] = response.data.translated_texts || [];

      // Validate: reject error page content that leaked as "translations"
      return translatedTexts.map((translated, i) => {
        if (
          typeof translated !== 'string' ||
          translated.includes('Error 500') ||
          translated.includes('Server Error') ||
          translated.includes("That's an error") ||
          translated.includes("That's all we know") ||
          translated.includes('<!DOCTYPE') ||
          translated.includes('<html')
        ) {
          console.warn(`[Translation] Rejected bad translation for: "${texts[i]?.substring(0, 40)}..."`);
          return texts[i]; // Return original text as fallback
        }
        return translated;
      });
    } catch (err) {
      console.error('[Chunk Translation Error]:', err.message);
      return texts;
    }
  }
}
