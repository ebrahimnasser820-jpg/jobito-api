const { Client } = require('pg');
const fs = require('fs');

async function checkUserColumns() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'mlpoknbv',
    database: 'jobito',
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'users'
      ORDER BY column_name;
    `);
    const output = res.rows.map(row => `${row.column_name}: ${row.data_type}`).join('\n');
    fs.writeFileSync('user_schema_result.txt', output);
    console.log('SUCCESS');
  } catch (err) {
    fs.writeFileSync('user_schema_result.txt', 'ERROR: ' + err.message);
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkUserColumns();
