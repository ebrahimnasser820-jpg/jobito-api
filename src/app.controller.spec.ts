import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "API is working"', () => {
      expect(appController.getRoot()).toEqual({ message: 'API is working' });
    });
  });

  describe('config', () => {
    it('should return public config', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      expect(appController.getPublicConfig()).toEqual({
        GOOGLE_CLIENT_ID: 'test-client-id',
      });
    });
  });
});
