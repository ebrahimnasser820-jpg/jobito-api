const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('⚡ Connected to database.');

  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'ptj';"
  );

  const tables = res.rows.map(r => 'ptj.' + r.table_name);
  console.log('📊 All tables:', tables);

  if (tables.length > 0) {
    await client.query('TRUNCATE TABLE ' + tables.join(', ') + ' CASCADE;');
    console.log('✅ All ' + tables.length + ' tables wiped successfully!');
  } else {
    console.log('ℹ️ No tables found.');
  }

  await client.end();
  console.log('🔌 Connection closed.');
}

main();
