import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminAuthService } from '../src/admin/services/admin-auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminAuthService = app.get(AdminAuthService);

  const fullName = 'محمد ناصر محمد محمد امام';
  const email = 'mohamednasseremam380@gmil.com';
  const password = 'mlpoknbv';

  try {
    console.log(`Attempting to create Super Admin: ${email}`);
    const result = await adminAuthService.setupFirstAdmin(fullName, email, password);
    console.log('Success:', result.message);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    if (error.message.includes('already has admins')) {
      console.log('System already initialized. If you need to add this specific user, use the invitation system or manual DB insertion.');
    }
  } finally {
    await app.close();
  }
}

bootstrap();
