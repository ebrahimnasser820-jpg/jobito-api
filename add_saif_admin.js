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
    const email = 'saif1012816@gmail.com';
    const passwordHash = '$2b$12$oDh/t73nScWfD/hn5Mj4Wep58KbDwFc53lAI20P0NYbVdndJ24rFe'; // password: Admin1!SuperHardPassword!@#
    const fullName = 'Saif Admin';

    // First check if admin exists
    const checkRes = await client.query('SELECT * FROM ptj.admins WHERE email = $1', [email]);
    
    if (checkRes.rows.length > 0) {
      // Update existing
      await client.query(
        'UPDATE ptj.admins SET password_hash = $1 WHERE email = $2',
        [passwordHash, email]
      );
      console.log('✅ Admin password updated successfully!');
    } else {
      // Insert new
      await client.query(
        'INSERT INTO ptj.admins (full_name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        [fullName, email, passwordHash, 'super_admin', true]
      );
      console.log('✅ New Admin created successfully!');
    }
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
