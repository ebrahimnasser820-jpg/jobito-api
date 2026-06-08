const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const plainPassword = 'Ahmed@123456';
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  
  await client.connect();
  try {
    const res = await client.query(
      'UPDATE ptj.admins SET password_hash = $1 WHERE email = $2',
      [hash, 'Ahmedhabashy898@gmail.com']
    );
    console.log('Password updated. Rows affected:', res.rowCount);
    console.log('New password is:', plainPassword);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
