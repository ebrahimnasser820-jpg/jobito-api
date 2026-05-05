const { Client } = require('pg');

async function listAllTables() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jobito',
    password: 'mlpoknbv',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query(\`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    \`);
    console.log('Schema for "users" table:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

listAllTables();
