const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log('⚡ Connected to Supabase Database successfully.');
  
  try {
    // 1. Query all tables currently existing in the 'ptj' schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'ptj';
    `);
    
    const existingTables = res.rows.map(row => row.table_name);
    console.log('📊 Existing tables in database:', existingTables);

    // 2. Define tables we want to protect (DO NOT wipe)
    const protectedTables = [
      'categories',
      'help_categories',
      'help_articles',
      'admins',
      'translations'
    ];

    // 3. Filter the tables to truncate
    const tablesToTruncate = existingTables
      .filter(table => !protectedTables.includes(table))
      .map(table => `ptj.${table}`);

    if (tablesToTruncate.length === 0) {
      console.log('ℹ️ No tables to truncate.');
      return;
    }

    console.log('⏳ Wiping transactional data from existing tables:', tablesToTruncate);
    
    // 4. Run TRUNCATE with CASCADE
    const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE;`;
    await client.query(truncateQuery);
    
    console.log('✅ Success! All transactional test data has been cleanly deleted. Database is now fresh.');
  } catch (err) {
    console.error('❌ Error while wiping database:', err);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

main();
