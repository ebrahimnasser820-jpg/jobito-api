
const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres:mlpoknbv@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("Connected.");
    
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'audit_logs'
    `);
    console.log("Audit logs table info:", JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error("Diagnostic failed:", err.message);
  } finally {
    await client.end();
  }
}

check();
