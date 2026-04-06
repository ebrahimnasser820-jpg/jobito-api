
const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres:mlpoknbv@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("SUCCESS: Connected with password from .env.");
    
    // Quick test
    const res = await client.query("SELECT COUNT(*) FROM ptj.jobs");
    console.log("Jobs count:", res.rows[0].count);

  } catch (err) {
    console.error("FAILURE: Could not connect with password from .env:", err.message);
  } finally {
    await client.end();
  }
}

check();
