const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    await client.connect();
    
    // Check in companies table using contact_email
    const res = await client.query('SELECT * FROM ptj.companies WHERE LOWER("contact_email") = LOWER($1)', ['Ahmedhabashy898@gmail.com']);
    
    if (res.rows.length > 0) {
      console.log('✅ Found in ptj.companies:', res.rows[0].name, '| Email:', res.rows[0].contact_email);
    } else {
      console.log('❌ NOT in ptj.companies.');
    }

    // List all tables in ptj schema
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ptj'");
    console.log("Tables in ptj:", tables.rows.map(r => r.table_name).join(", "));
    
    // If there is an admins table, check there too just in case
    if (tables.rows.some(r => r.table_name === 'admins')) {
       const admins = await client.query('SELECT * FROM ptj.admins WHERE LOWER("email") = LOWER($1)', ['Ahmedhabashy898@gmail.com']);
       if (admins.rows.length > 0) console.log('✅ Found in ptj.admins');
    }
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await client.end();
  }
}

checkUser();
