import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'companies';
    `);
    console.log('Columns in ptj.companies:');
    res.rows.forEach(row => console.log(`- ${row.column_name}`));
    
    const missing = ['logo_url', 'office_photo1_url', 'office_photo2_url'].filter(
      col => !res.rows.some(row => row.column_name === col)
    );
    
    if (missing.length > 0) {
      console.log('Missing columns:', missing);
      console.log('Attempting to add missing columns...');
      for (const col of missing) {
        await client.query(`ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "${col}" text;`);
        console.log(`Added column: ${col}`);
      }
    } else {
      console.log('All required columns exist.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkColumns();
