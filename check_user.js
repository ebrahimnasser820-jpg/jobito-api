
const { Client } = require('pg');

async function checkUser() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    const email = 'mohamednasseremam380@gmail.com';
    const res = await client.query("SELECT user_id, email, full_name FROM ptj.users WHERE email = $1", [email]);
    console.log(`User details for ${email}:`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkUser();
