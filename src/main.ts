// Main entry point for Jobito API
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/configs/logger.config.js';

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function (this: bigint) {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // URL rewrite middleware for backward compatibility
  app.use((req: any, res: any, next: any) => {
    const url = req.url;
    // If the request doesn't start with /api/ and is not for /uploads/, prepend /api
    if (
      !url.startsWith('/api/') &&
      !url.startsWith('/uploads/') &&
      url !== '/api' &&
      url !== '/uploads'
    ) {
      req.url = `/api${url}`;
    }
    next();
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    },
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // Validating origin (wildcard logic for development)
      callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-lang, ngrok-skip-browser-warning',
    exposedHeaders: 'Content-Range, X-Content-Range',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Start microservices (Disabled for Monolithic testing)
  // await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host, () => {
    console.log(`🚀 Monolithic Server is running on http://${host}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});