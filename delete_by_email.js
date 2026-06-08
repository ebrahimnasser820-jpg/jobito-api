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
    const email = 'rolanaeem2004@gmail.com';
    
    // First, find the user
    const res = await client.query('SELECT user_id FROM ptj.users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log(`User with email ${email} not found in ptj.users.`);
    } else {
      const userId = res.rows[0].user_id;
      console.log(`Found user ID: ${userId}`);
      
      // Delete from ptj.users (assuming ON DELETE CASCADE for foreign keys, or we might need to delete from local_auth first)
      await client.query('DELETE FROM ptj.local_auth WHERE user_id = $1', [userId]).catch(e => console.log('No local_auth record or error:', e.message));
      await client.query('DELETE FROM ptj.user_sessions WHERE user_id = $1', [userId]).catch(e => console.log('No user_sessions record or error:', e.message));
      await client.query('DELETE FROM ptj.verification_otps WHERE user_id = $1', [userId]).catch(e => console.log('No verification_otps record or error:', e.message));
      
      const deleteRes = await client.query('DELETE FROM ptj.users WHERE user_id = $1', [userId]);
      console.log(`Deleted ${deleteRes.rowCount} user(s).`);
    }

    const companyRes = await client.query('SELECT company_id FROM ptj.companies WHERE contact_email = $1', [email]);
    if (companyRes.rows.length === 0) {
      console.log(`Email ${email} not found in ptj.companies.`);
    } else {
      const companyId = companyRes.rows[0].company_id;
      console.log(`Found company ID: ${companyId}`);
      const deleteComp = await client.query('DELETE FROM ptj.companies WHERE company_id = $1', [companyId]);
      console.log(`Deleted ${deleteComp.rowCount} company.`);
    }
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
