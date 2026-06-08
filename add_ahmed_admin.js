const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  try {
    const res = await client.query(
      'INSERT INTO ptj.admins (admin_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [
        require('crypto').randomUUID(),
        'Ahmed Habashy',
        'Ahmedhabashy898@gmail.com',
        '$2b$10$K17NGPhzWRRAkij0h9FIJec4TIc4zDu2zm3qGbR0w/Cm82lsVFzJy',
        'super_admin'
      ]
    );
    console.log('Inserted:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
