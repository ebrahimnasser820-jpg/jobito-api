const { Client } = require('pg');
const client = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'mlpoknbv', database: 'jobito' });
client.connect().then(async () => {
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ptj'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
