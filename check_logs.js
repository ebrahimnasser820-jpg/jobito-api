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
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ptj.admin_activity_logs) as activity_logs_count,
        (SELECT COUNT(*) FROM ptj.users) as total_users,
        (SELECT COUNT(*) FROM ptj.users WHERE is_active = true) as active_users
    `);
    console.log('Database Counts:', counts.rows[0]);

    const latestLogs = await client.query(`
      SELECT log_id, action_type, description, created_at 
      FROM ptj.admin_activity_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('Latest Logs:', latestLogs.rows);
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
