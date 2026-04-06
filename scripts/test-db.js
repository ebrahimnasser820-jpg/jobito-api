const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected');
    const res = await client.query('SELECT * FROM ptj.companies LIMIT 1');
    console.log('Result:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
