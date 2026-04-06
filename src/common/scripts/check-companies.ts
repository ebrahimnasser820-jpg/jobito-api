const { Client } = require('pg');
const fs = require('fs');

async function checkCompanies() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'mlpoknbv',
    database: 'jobito'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT company_id, name, contact_email, char_length(description) as desc_len, LEFT(description, 50) as desc_start FROM ptj.companies');
    const output = {
      total: res.rowCount,
      rows: res.rows
    };
    fs.writeFileSync('db-check-res.json', JSON.stringify(output, null, 2));
  } catch (err) {
    fs.writeFileSync('db-check-res.json', JSON.stringify({ error: err.message, stack: err.stack }, null, 2));
  } finally {
    await client.end();
  }
}

checkCompanies();
