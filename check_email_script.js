const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const res = await client.query("DELETE FROM ptj.users WHERE email = 'ahmedhabashy898@gmail.com' RETURNING *");
    console.log("Deleted User:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("DB ERROR", err);
  } finally {
    await client.end();
  }
}
main().catch(console.error);
