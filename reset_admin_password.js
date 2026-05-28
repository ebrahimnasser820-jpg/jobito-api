const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetPassword() {
  await client.connect();
  try {
    const newPassword = 'admin123'; // كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update admin@jobito.com
    await client.query(
      'UPDATE ptj.admins SET password_hash = $1 WHERE email = $2',
      [hashedPassword, 'admin@jobito.com']
    );
    
    // Update ops@jobito.com
    await client.query(
      'UPDATE ptj.admins SET password_hash = $1 WHERE email = $2',
      [hashedPassword, 'ops@jobito.com']
    );

    console.log('✅ Passwords have been successfully reset to: ' + newPassword);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await client.end();
  }
}

resetPassword();
