import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("DELETE FROM ptj.users WHERE LOWER(email) = LOWER($1)", ["Zazahabashy@gmail.com"]);
    console.log(`Deleted ${res.rowCount} users from users table.`);

    const res2 = await client.query("DELETE FROM ptj.companies WHERE LOWER(contact_email) = LOWER($1)", ["Zazahabashy@gmail.com"]);
    console.log(`Deleted ${res2.rowCount} companies from companies table.`);
  } catch(e) {
    console.error(e);
  }
  await client.end();
}
run();
