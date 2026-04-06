 const { Client } = require('pg');
const fs = require('fs');

async function checkSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'mlpoknbv',
    database: 'jobito'
  });

  try {
    await client.connect();
    const cols = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'companies'
    `);
    
    fs.writeFileSync('schema-res.json', JSON.stringify({ columns: cols.rows }, null, 2));
  } catch (err) {
    fs.writeFileSync('schema-res.json', JSON.stringify({ error: err.message }, null, 2));
  } finally {
    await client.end();
  }
}

checkSchema();
