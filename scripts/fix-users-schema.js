const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

async function run() {
  console.log('Starting Users Table Schema Fix...');
  try {
    await client.connect();
    console.log('Connected to Postgres');
    
    const statements = [
      "ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS classification VARCHAR(100);",
      "ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light';",
      "ALTER TABLE ptj.users ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en';"
    ];

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      try {
        await client.query(stmt);
        console.log('✅ Success');
      } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('💥 Connection failed:', err.message);
  } finally {
    await client.end();
    console.log('Disconnected');
  }
}

run();
