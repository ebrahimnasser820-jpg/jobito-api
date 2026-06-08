const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateEmail() {
  await client.connect();
  try {
    const res = await client.query(
      "UPDATE ptj.admins SET email = $1 WHERE email = $2 OR email = $3",
      ['mohamednasseremam380@gmail.com', 'mohamednasser@gmail.com', 'mohamednasser--emam@gmail.com']
    );
    console.log('✅ Admin email has been successfully updated. Rows affected:', res.rowCount);
  } catch (err) {
    console.error('Error updating email:', err);
  } finally {
    await client.end();
  }
}

updateEmail();
