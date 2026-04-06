const { Client } = require('pg');

async function fixSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
  });

  try {
    await client.connect();
    console.log('Connected to database. Repairing schema...');

    const commands = [
      // Fix companies table
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS license_number VARCHAR(100)',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS rejection_reason TEXT',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedDay" VARCHAR(50)',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedMonth" VARCHAR(50)',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedYear" VARCHAR(50)',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "socialLinks" JSONB',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "benefits" JSONB',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS logo_url TEXT',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo1_url TEXT',
      'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo2_url TEXT',
      
      // Fix jobs table
      'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_min NUMERIC(10,2)',
      'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_max NUMERIC(10,2)',
      'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS price_type VARCHAR(50) DEFAULT \'fixed\'',
      'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false',
      'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ',
      
      // Fix users table
      'ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT \'{"applications":true,"jobs":false,"recs":false}\'',
      'ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true',
      'ALTER TABLE ptj.users RENAME COLUMN is_active TO "isActive"', // Try to rename if exists in old name
    ];

    for (const sql of commands) {
      try {
        await client.query(sql);
        console.log(`Executed: ${sql}`);
      } catch (e) {
        console.warn(`Skipped/Failed: ${sql} - ${e.message}`);
      }
    }

    console.log('Schema repair completed.');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

fixSchema();
