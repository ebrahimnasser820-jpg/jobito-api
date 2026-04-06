const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM ptj.companies');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
