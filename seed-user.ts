import * as bcrypt from 'bcryptjs';
import { AppDataSource } from './src/database/typeorm.config';

async function seed() {
  await AppDataSource.initialize();
  const email = 'mlpoknbv8097@gmail.com';
  const plainPassword = 'mlpoknbv';
  const hash = bcrypt.hashSync(plainPassword, 10);
  
  await AppDataSource.query(
    `INSERT INTO ptj.users(email, password_hash, role, full_name, is_active) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (email) 
     DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true`,
    [email, hash, 'company', 'Test Company', true]
  );
  
  console.log('✅ User successfully seeded with correct password hash!');
  await AppDataSource.destroy();
}

seed().catch(console.error);
