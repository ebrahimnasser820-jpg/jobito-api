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
  console.log('⚡ Connected to Supabase Database successfully.');
  
  const emailToCheck = 'mohamednasseremam380@gmail.com';
  
  try {
    const res = await client.query('SELECT user_id, email, classification, account_status, criminal_record_url, services FROM ptj.users WHERE email = $1', [emailToCheck]);
    if (res.rows.length === 0) {
      console.log(`ℹ️ User with email ${emailToCheck} not found in DB.`);
    } else {
      const user = res.rows[0];
      console.log('👤 User details in DB:');
      console.log(`- ID: ${user.user_id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Classification: ${user.classification}`);
      console.log(`- Account Status: ${user.account_status}`);
      console.log(`- Criminal Record URL: ${user.criminal_record_url}`);
      console.log(`- Services:`, user.services);
    }
  } catch (err) {
    console.error('❌ Error checking user:', err);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

main();
