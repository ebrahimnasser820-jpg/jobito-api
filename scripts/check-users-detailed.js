const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function checkSchema() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    let output = 'Columns in ptj.users:\n';
    res.rows.forEach(row => {
      output += `- ${row.column_name} (${row.data_type})\n`;
    });
    fs.writeFileSync('c:\\Users\\MOHAM\\Project\\Jobito\\jobito-api\\scripts\\schema-results.txt', output);
    console.log('Results written to schema-results.txt');
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
