const { Client } = require('pg');

async function checkAdmin() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jobito',
    password: 'mlpoknbv',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT name, email, role FROM admins');
    console.log('Current Admins in Database:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

checkAdmin();
