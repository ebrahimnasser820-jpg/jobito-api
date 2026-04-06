
const { Client } = require('pg');

async function check() {
  console.log("Starting connection test to 127.0.0.1...");
  const client = new Client({
    connectionString: "postgresql://postgres:mlpoknbv@127.0.0.1:5432/jobito",
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    console.log("SUCCESS: Connected to 127.0.0.1.");
    const res = await client.query("SELECT COUNT(*) FROM ptj.jobs");
    console.log("Jobs count:", res.rows[0].count);
  } catch (err) {
    console.error("FAILURE:", err.message);
  } finally {
    await client.end();
  }
}

check();
