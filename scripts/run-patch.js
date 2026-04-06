const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function patchSchema() {
  try {
    await client.connect();
    console.log('Connected to DB. Starting migration...');
    
    const sqlPath = path.join(__dirname, 'patch-users-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('Migration successful: Missing columns added to ptj.users.');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

patchSchema();
