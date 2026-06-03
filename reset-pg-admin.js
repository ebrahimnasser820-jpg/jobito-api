require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const args = process.argv.slice(2);

  const pgUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();

  if (args.length === 0) {
    console.log('\n--- 🧑‍💼 Admin Emails (ptj.admins) ---');
    try {
      const adminRes = await client.query('SELECT email, role FROM ptj.admins');
      if (adminRes.rows.length === 0) console.log('No admins found.');
      adminRes.rows.forEach(r => console.log(`👉 Email: ${r.email} | Role: ${r.role}`));
    } catch (e) { console.error('Error fetching admins:', e.message); }

    console.log('\n--- 🧑‍💻 User Emails (ptj.users) ---');
    try {
      const userRes = await client.query("SELECT email, role FROM ptj.users WHERE role='admin' OR role='operation_manager'");
      if (userRes.rows.length === 0) console.log('No admin users found in users table.');
      userRes.rows.forEach(r => console.log(`👉 Email: ${r.email} | Role: ${r.role}`));
    } catch (e) { console.error('Error fetching users:', e.message); }

    await client.end();
    process.exit(0);
  }

  if (args.length === 3) {
    const table = args[0] === 'admins' ? 'ptj.admins' : 'ptj.users';
    const targetEmail = args[1];
    const newPassword = args[2];

    const res = await client.query(`SELECT email FROM ${table} WHERE email = $1`, [targetEmail]);
    if (res.rows.length === 0) {
      console.error(`❌ User not found in ${table}!`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await client.query(`UPDATE ${table} SET password_hash = $1 WHERE email = $2`, [hashedPassword, targetEmail]);

    console.log(`✅ Password updated successfully for ${targetEmail}!`);
    await client.end();
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
