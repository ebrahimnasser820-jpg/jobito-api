
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'ptj' AND table_name = 'companies'");
    console.log("Columns in ptj.companies:");
    res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkSchema();
