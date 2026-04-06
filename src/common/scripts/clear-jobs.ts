import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jobito',
});

async function clearData() {
  try {
    await client.connect();
    console.log('✅ Connected to the database.');

    console.log('🗑️ Deleting all jobs and companies...');
    await client.query('TRUNCATE TABLE ptj.jobs, ptj.companies CASCADE;');
    
    console.log('🎉 ✨ All job and company data has been successfully cleared! The structure remains intact.');
  } catch (err) {
    console.error('❌ Error clearing data:', err.message);
  } finally {
    await client.end();
  }
}

clearData();
