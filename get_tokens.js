const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  try {
    const res = await client.query("SELECT user_id, device_token FROM ptj.push_subscriptions WHERE platform = 'fcm' AND is_active = true LIMIT 5");
    console.log('Active FCM Tokens:', JSON.stringify(res.rows, null, 2));
    if (res.rows.length === 0) {
      console.log('No FCM tokens found in the database.');
    }
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
