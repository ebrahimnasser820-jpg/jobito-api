const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'mlpoknbv',
    database: 'jobito'
  });

  try {
    await client.connect();
    console.log('Connected');

    // Find and delete duplicates based on name and contact_email
    // Keep the one with the highest company_id (latest)
    const res = await client.query(`
      DELETE FROM ptj.companies
      WHERE company_id IN (
        SELECT company_id
        FROM (
          SELECT company_id,
                 ROW_NUMBER() OVER (PARTITION BY LOWER(name), LOWER(contact_email) ORDER BY company_id DESC) as row_num
          FROM ptj.companies
        ) t
        WHERE t.row_num > 1
      );
    `);
    
    console.log(`Deleted ${res.rowCount} duplicates.`);

    // Also clean up junk descriptions that start with figma metadata
    const cleanupDesc = await client.query(`
      UPDATE ptj.companies
      SET description = 'Leading company in their field.'
      WHERE description LIKE '%figmeta%' OR description LIKE '%figma%';
    `);
    console.log(`Cleaned up ${cleanupDesc.rowCount} junk descriptions.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

cleanup();
