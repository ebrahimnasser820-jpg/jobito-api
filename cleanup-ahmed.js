const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function cleanup() {
  try {
    await client.connect();
    
    // 1. Delete company
    console.log('Deleting from ptj.companies...');
    const resComp = await client.query('DELETE FROM ptj.companies WHERE LOWER("contact_email") = LOWER($1) RETURNING *', ['Ahmedhabashy898@gmail.com']);
    console.log(`Deleted ${resComp.rowCount} companies.`);

    // 2. Delete any matching users with email or starting with deleted_ UUID
    console.log('Deleting from ptj.users...');
    // We can just try to delete if any
    const resUser = await client.query(`DELETE FROM ptj.users WHERE LOWER("email") = LOWER($1) OR "email" LIKE '%deleted_%@jobito.com' AND "registration_data" LIKE '%Ahmedhabashy898@gmail.com%' RETURNING *`, ['Ahmedhabashy898@gmail.com']);
    console.log(`Deleted ${resUser.rowCount} users.`);
    
    console.log('✅ Cleanup finished successfully.');

  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await client.end();
  }
}

cleanup();
