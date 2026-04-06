const { Client } = require('pg');

async function checkColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'companies'
    `);
    console.log('COLUMNS_START');
    res.rows.forEach(row => console.log(row.column_name));
    console.log('COLUMNS_END');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkColumns();
