
const { Client } = require('pg');

async function checkId() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    const id = '405c4c2d-48f7-4143-8306-f2e3e114d657';
    const res = await client.query("SELECT COUNT(*) FROM ptj.users WHERE user_id = $1", [id]);
    console.log(`Count for ID ${id}: ${res.rows[0].count}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkId();
