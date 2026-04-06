
const { Client } = require('pg');
const fs = require('fs');

async function checkUser() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    const email = 'mohamednasseremam380@gmail.com';
    const res = await client.query("SELECT user_id, email, full_name FROM ptj.users WHERE email = $1", [email]);
    const output = JSON.stringify(res.rows, null, 2);
    fs.writeFileSync('user_id.txt', output);
    console.log("Done");
  } catch (err) {
    fs.writeFileSync('user_id.txt', "Error: " + err.message);
  } finally {
    await client.end();
  }
}

checkUser();
