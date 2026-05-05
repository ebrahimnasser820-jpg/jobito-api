const { Client } = require('pg');

async function listColumns() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jobito',
    password: 'mlpoknbv',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'ptj' AND table_name = 'admins'");
    console.log('Columns in ptj.admins:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

listColumns();
