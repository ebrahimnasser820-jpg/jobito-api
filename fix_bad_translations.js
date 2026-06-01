const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.heyrppnmpcfjyallyqgo:Jobito%402026Strong@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('⚡ Connected to database.');

  try {
    // 1. Find bad translations
    const findRes = await client.query(`
      SELECT translation_id, translation_key, 
             SUBSTRING(en, 1, 80) as en_preview, 
             SUBSTRING(ar, 1, 80) as ar_preview 
      FROM ptj.translations 
      WHERE en LIKE '%Error 500%' OR ar LIKE '%Error 500%'
         OR en LIKE '%Server Error%' OR ar LIKE '%Server Error%'
         OR en LIKE '%That''s an error%' OR ar LIKE '%That''s an error%'
         OR en LIKE '%That''s all we know%' OR ar LIKE '%That''s all we know%'
    `);

    console.log(`\n🔍 Found ${findRes.rows.length} bad translation(s):`);
    findRes.rows.forEach(row => {
      console.log(`  - ID: ${row.translation_id} | Key: ${row.translation_key}`);
      console.log(`    EN: ${row.en_preview}`);
      console.log(`    AR: ${row.ar_preview}`);
    });

    if (findRes.rows.length > 0) {
      // 2. Delete bad translations
      const delRes = await client.query(`
        DELETE FROM ptj.translations 
        WHERE en LIKE '%Error 500%' OR ar LIKE '%Error 500%'
           OR en LIKE '%Server Error%' OR ar LIKE '%Server Error%'
           OR en LIKE '%That''s an error%' OR ar LIKE '%That''s an error%'
           OR en LIKE '%That''s all we know%' OR ar LIKE '%That''s all we know%'
      `);
      console.log(`\n✅ Deleted ${delRes.rowCount} bad translation(s) from database.`);
    } else {
      console.log('\n✅ No bad translations found. Database is clean.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

main();
