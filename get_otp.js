const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: {
    rejectUnauthorized: false
  }
});

async function getOtp() {
  await client.connect();
  try {
    const res = await client.query("SELECT code, is_used, expires_at FROM ptj.otp_codes WHERE admin_id = '2e654bf9-a3ea-40ed-8b20-4541eb9909f1' ORDER BY expires_at DESC LIMIT 5");
    console.log('OTP details for Saif:', res.rows);
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

getOtp();
