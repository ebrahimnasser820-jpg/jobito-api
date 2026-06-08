const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  try {
    const adminRes = await client.query("SELECT admin_id FROM ptj.admins WHERE email = 'Ahmedhabashy898@gmail.com'");
    if (adminRes.rowCount > 0) {
      const adminId = adminRes.rows[0].admin_id;
      console.log('Admin ID:', adminId);
      const otpRes = await client.query("SELECT code, expires_at, is_used, created_at FROM ptj.otp_codes WHERE admin_id = $1 ORDER BY created_at DESC LIMIT 3", [adminId]);
      console.log('OTP codes:', otpRes.rows);
    } else {
      console.log('Admin not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
