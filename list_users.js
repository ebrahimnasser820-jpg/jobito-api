
const { Client } = require('pg');

async function listUsers() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    const res = await client.query("SELECT user_id, email, full_name, role FROM ptj.users LIMIT 20;");
    console.log("Users in ptj.users:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

listUsers();
