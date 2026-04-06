import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jobito',
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT company_id, name FROM ptj.companies ORDER BY company_id DESC LIMIT 1');
  console.log('LATEST COMPANY ID IS:', res.rows[0]?.company_id);
  await client.end();
}
run();
