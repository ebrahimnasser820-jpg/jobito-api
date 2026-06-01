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
    const res = await client.query(`
      SELECT application_id, user_id, job_id, resume_url, applied_at, status 
      FROM ptj.applications 
      ORDER BY applied_at DESC 
      LIMIT 30;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
