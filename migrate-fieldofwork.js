/**
 * Migration Script: Convert field_of_work from varchar to json
 * 
 * Run this BEFORE restarting the server with the new entity changes.
 * This converts existing single-string values to JSON arrays.
 * 
 * Usage: node migrate-fieldofwork.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jobito',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. First, check current column type
    const typeCheck = await client.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'jobs' AND column_name = 'field_of_work'
    `);
    
    const currentType = typeCheck.rows[0]?.data_type;
    console.log(`📋 Current field_of_work column type: ${currentType}`);

    if (currentType === 'character varying' || currentType === 'text') {
      // 2. Convert existing varchar values to JSON arrays
      console.log('🔄 Converting existing field_of_work values to JSON arrays...');
      
      // Update non-null values: "programming" -> ["programming"]
      const updateResult = await client.query(`
        UPDATE ptj.jobs 
        SET field_of_work = CASE 
          WHEN field_of_work IS NOT NULL AND field_of_work != '' 
          THEN ('["' || field_of_work || '"]')::json::text
          ELSE '[]'
        END
        WHERE field_of_work IS NOT NULL
      `);
      console.log(`✅ Updated ${updateResult.rowCount} rows`);

      // 3. Change column type to json
      console.log('🔄 Altering column type to json...');
      await client.query(`
        ALTER TABLE ptj.jobs 
        ALTER COLUMN field_of_work TYPE json 
        USING CASE 
          WHEN field_of_work IS NOT NULL AND field_of_work != '' 
          THEN field_of_work::json 
          ELSE '[]'::json 
        END
      `);
      console.log('✅ Column type changed to json');
    } else {
      console.log('ℹ️  Column is already json type, skipping conversion');
    }

    // 4. Create the join table if not exists (TypeORM will do this, but just in case)
    console.log('🔄 Creating job_categories join table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ptj.job_categories (
        job_id bigint NOT NULL REFERENCES ptj.jobs(job_id) ON DELETE CASCADE,
        category_id bigint NOT NULL REFERENCES ptj.categories(category_id) ON DELETE CASCADE,
        PRIMARY KEY (job_id, category_id)
      )
    `);
    console.log('✅ job_categories table ready');

    // 5. Populate join table from existing categoryId relations
    console.log('🔄 Populating join table from existing category relations...');
    const populateResult = await client.query(`
      INSERT INTO ptj.job_categories (job_id, category_id)
      SELECT job_id, category_id FROM ptj.jobs 
      WHERE category_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    console.log(`✅ Populated ${populateResult.rowCount} relations`);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
