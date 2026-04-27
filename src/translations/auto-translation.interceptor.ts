import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TranslationEngineService } from './translation-engine.service.js';

@Injectable()
export class AutoTranslationInterceptor implements NestInterceptor {
  constructor(private translationEngine: TranslationEngineService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang = request.headers['x-lang'] || request.query.lang;
    const langValue = Array.isArray(lang) ? lang[0] : (lang as string);
    const targetLang = (langValue === 'ar' || langValue === 'en') ? langValue : 'ar';

    // Only translate if a target language is specified and it's not English
    // Also skip for translation-related endpoints to avoid recursion/redundancy
    if (targetLang === 'en' || request.url.includes('/translations')) {
      return next.handle();
    }

    return next.handle().pipe(
      switchMap((data) => {
        if (!data) return from(Promise.resolve(data));
        return from(this.translateData(data, targetLang));
      }),
    );
  }

  private async translateData(data: any, targetLang: 'ar' | 'en'): Promise<any> {
    if (Array.isArray(data)) {
      const translatableFields = ['title', 'description', 'position', 'location', 'category'];
      const stringsToTranslate: { path: string; text: string }[] = [];

      data.forEach((item, index) => {
        translatableFields.forEach((field) => {
          if (item[field] && typeof item[field] === 'string') {
            stringsToTranslate.push({ path: `${index}.${field}`, text: item[field] });
          }
        });
      });

        const isArabicRequest = targetLang === 'ar';
        const filteredStrings = stringsToTranslate.filter(s => {
          const hasArabic = /[\u0600-\u06FF]/.test(s.text);
          // If it's an Arabic request and the text is already Arabic, don't translate
          return !(isArabicRequest && hasArabic);
        });

        if (filteredStrings.length > 0) {
          const translations = await this.translationEngine.translateBatch(
            filteredStrings.map((s) => s.text),
            targetLang,
          );

          filteredStrings.forEach((s, i) => {
            const [idxStr, field] = s.path.split('.');
            const idx = parseInt(idxStr, 10);
            if (data[idx]) {
              data[idx][field] = translations[i];
            }
          });
        }
      return data;
    } else if (data && typeof data === 'object') {
       const translatableFields = ['title', 'description', 'position', 'location', 'category'];
       const stringsToTranslate: string[] = [];
       const fieldsFound: string[] = [];

       translatableFields.forEach(field => {
         if (data[field] && typeof data[field] === 'string') {
           stringsToTranslate.push(data[field]);
           fieldsFound.push(field);
         }
       });

       if (stringsToTranslate.length > 0) {
         const isArabicRequest = targetLang === 'ar';
         const filteredStrings: { field: string; text: string }[] = [];
         
         fieldsFound.forEach((field, i) => {
           const text = stringsToTranslate[i];
           const hasArabic = /[\u0600-\u06FF]/.test(text);
           if (!(isArabicRequest && hasArabic)) {
             filteredStrings.push({ field, text });
           }
         });

         if (filteredStrings.length > 0) {
           const translations = await this.translationEngine.translateBatch(
             filteredStrings.map(s => s.text), 
             targetLang
           );
           filteredStrings.forEach((s, i) => {
             data[s.field] = translations[i];
           });
         }
       }
       return data;
    }

    return data;
  }
}
