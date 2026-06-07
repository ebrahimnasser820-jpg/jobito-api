const { Client } = require('pg');
const bcrypt = require('bcryptjs');
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
    const newPassword = 'X#9vQz!2@pKmL$8wN';
    
    console.log('Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update existing
    await client.query(
      'UPDATE ptj.admins SET password_hash = $1 WHERE email = $2',
      [passwordHash, email]
    );
    console.log('✅ Admin password updated successfully to the hard password!');
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
