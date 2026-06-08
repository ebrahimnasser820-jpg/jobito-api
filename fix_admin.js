const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    // Delete the duplicate if it exists
    await client.query("DELETE FROM ptj.admins WHERE email = 'mohamednasser--emam@gmail.com'");
    // Update the correct one
    const res = await client.query(
      "UPDATE ptj.admins SET email = 'mohamednasseremam380@gmail.com' WHERE email = 'mohamednasser@gmail.com'"
    );
    console.log('✅ Admin updated successfully. Rows updated:', res.rowCount);
  } catch (err) {
    console.error('Error updating admin:', err);
  } finally {
    await client.end();
  }
}
run();
