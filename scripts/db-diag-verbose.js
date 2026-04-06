
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('--- STARTING DIAGNOSTIC SCRIPT ---');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mlpoknbv',
  database: process.env.DB_NAME || 'jobito',
});

async function run() {
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Setting search path...');
    await client.query('SET search_path TO ptj, public;');
    
    console.log('Checking categories table in ptj...');
    const res = await client.query('SELECT * FROM ptj.categories LIMIT 5;');
    console.log('Query finished. Found:', res.rowCount, 'rows');
    res.rows.forEach(r => console.log('Category:', r.name));

  } catch (err) {
    console.error('FATAL ERROR:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    console.log('Closing connection...');
    await client.end();
    console.log('Done.');
  }
}

run();
