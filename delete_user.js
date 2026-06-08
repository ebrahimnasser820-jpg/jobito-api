const { Client } = require('pg');

const connectionString = 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:5432/postgres';

async function deleteUser() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to DB.");
    
    const email = 'zazaemam4@gmail.com';
    
    // First, find the user
    const res = await client.query('SELECT user_id, role FROM "ptj"."users" WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log(`User ${email} not found.`);
      return;
    }
    
    const userId = res.rows[0].user_id;
    console.log(`Found user with ID: ${userId}`);
    
    // Attempt to delete related data if necessary, or just rely on CASCADE.
    const deleteRes = await client.query('DELETE FROM "ptj"."users" WHERE email = $1 RETURNING *', [email]);
    console.log(`Deleted user: ${deleteRes.rowCount} rows affected.`);

  } catch (err) {
    console.error("Error deleting user:", err);
  } finally {
    await client.end();
  }
}

deleteUser();
