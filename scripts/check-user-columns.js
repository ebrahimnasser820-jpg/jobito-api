const { Client } = require('pg');

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
    console.log('USER_COLUMNS_START');
    res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    console.log('USER_COLUMNS_END');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkUserColumns();
