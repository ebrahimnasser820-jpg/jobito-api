const pkg = require('pg');
const { Client } = pkg;
require('dotenv').config();

async function fix() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('Connected');
    
    const columns = [
      { name: 'logo_url', type: 'text' },
      { name: 'office_photo1_url', type: 'text' },
      { name: 'office_photo2_url', type: 'text' }
    ];

    for (const col of columns) {
      console.log(`Checking/Adding ${col.name}...`);
      await client.query(`ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`);
    }
    
    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fix();
