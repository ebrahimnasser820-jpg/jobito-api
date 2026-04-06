
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'jobito',
});

async function run() {
  try {
    await client.connect();
    console.log('--- DB DIAGNOSTICS ---');
    console.log('Connected to:', process.env.DB_NAME);

    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ptj'");
    console.log('Schema ptj exists:', schemas.rowCount > 0);

    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ptj' AND table_name = 'categories'");
    console.log('Table ptj.categories exists:', tables.rowCount > 0);

    if (tables.rowCount > 0) {
      const rows = await client.query('SELECT * FROM ptj.categories');
      console.log('Categories count in ptj.categories:', rows.rowCount);
      if (rows.rowCount > 0) {
        console.log('First 3 categories:', rows.rows.slice(0, 3).map(r => r.name));
      }
    }

    const publicTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories'");
    console.log('Table public.categories exists:', publicTables.rowCount > 0);
    
    if (publicTables.rowCount > 0) {
       const rowsPublic = await client.query('SELECT * FROM public.categories');
       console.log('Categories count in public.categories:', rowsPublic.rowCount);
    }

  } catch (err) {
    console.error('Error during diagnostics:', err);
  } finally {
    await client.end();
  }
}

run();
