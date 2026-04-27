const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('🚀 Connected to database for migration...');

    // 1. Add field_of_work column if it doesn't exist
    console.log('📝 Adding field_of_work column...');
    await client.query(`
      ALTER TABLE ptj.jobs 
      ADD COLUMN IF NOT EXISTS field_of_work VARCHAR(255);
    `);

    // 2. Check current type of job_type
    const res = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'jobs' AND column_name = 'job_type';
    `);
    
    const currentType = res.rows[0]?.data_type;
    console.log(`📊 Current job_type column type: ${currentType}`);

    if (currentType !== 'jsonb' && currentType !== 'json') {
      console.log('🔄 Converting job_type to JSONB...');
      // Drop default first to avoid casting error
      await client.query(`ALTER TABLE ptj.jobs ALTER COLUMN job_type DROP DEFAULT;`);
      await client.query(`
        ALTER TABLE ptj.jobs 
        ALTER COLUMN job_type TYPE JSONB 
        USING jsonb_build_array(job_type);
      `);
    }

    // 3. Set default value for job_type
    console.log('⚙️ Setting default value for job_type...');
    await client.query(`
      ALTER TABLE ptj.jobs 
      ALTER COLUMN job_type SET DEFAULT '["full-time"]'::jsonb;
    `);

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
