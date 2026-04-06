
const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    const userId = 'a94342be-f7fe-4e48-a6b4-9fd5c7c51b55';
    const res = await client.query('SELECT * FROM ptj.users WHERE user_id = $1', [userId]);
    console.log('User Record:', JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

check();
