const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

const sql = `
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS employees VARCHAR(50);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedDay" VARCHAR(50);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedMonth" VARCHAR(50);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedYear" VARCHAR(50);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS benefits JSONB;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS tech_stack JSONB;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS location_tags JSONB;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo1_url TEXT;
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo2_url TEXT;

  -- Also check Jobs table for missing columns
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_min NUMERIC(15,2);
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_max NUMERIC(15,2);
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS description_en TEXT;
  
  -- Add translation columns to companies if missing
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS description_en TEXT;

  -- Geography columns
  -- Note: These require PostGIS. If it fails, check if extension is enabled.
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
  ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
`;

async function run() {
  console.log('Starting DB fix...');
  try {
    await client.connect();
    console.log('Connected to Postgres');
    
    const statements = [
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS employees VARCHAR(50);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS industry VARCHAR(100);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS \"foundedDay\" VARCHAR(50);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS \"foundedMonth\" VARCHAR(50);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS \"foundedYear\" VARCHAR(50);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS \"socialLinks\" JSONB;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS benefits JSONB;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS tech_stack JSONB;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS location_tags JSONB;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo1_url TEXT;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS office_photo2_url TEXT;",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_min NUMERIC(15,2);",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_max NUMERIC(15,2);",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS description_en TEXT;",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS description_en TEXT;",
      "ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS location geography(Point, 4326);",
      "ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS location geography(Point, 4326);"
    ];

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      try {
        await client.query(stmt);
        console.log('Success');
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
    console.log('Disconnected');
  }
}

run();
