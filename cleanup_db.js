const { Client } = require('pg');

async function main() {
  const client = new Client({
    user: 'postgres',
    password: 'mlpoknbv',
    host: 'localhost',
    port: 5432,
    database: 'jobito',
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Show current state
    const jobs = await client.query('SELECT job_id, title, company_id FROM ptj.jobs ORDER BY job_id');
    console.log('\n=== CURRENT JOBS ===');
    jobs.rows.forEach(j => console.log('  ID:' + j.job_id + ' | company:' + j.company_id + ' | ' + j.title));

    const companies = await client.query('SELECT company_id, name FROM ptj.companies ORDER BY company_id');
    console.log('\n=== CURRENT COMPANIES ===');
    companies.rows.forEach(c => console.log('  ID:' + c.company_id + ' | ' + c.name));

    // 2. Delete applications first (FK constraint)
    const delApps = await client.query('DELETE FROM ptj.applications');
    console.log('\nDeleted ' + delApps.rowCount + ' applications');

    // 3. Delete ALL jobs
    const delAllJobs = await client.query('DELETE FROM ptj.jobs');
    console.log('Deleted ' + delAllJobs.rowCount + ' jobs');

    // 4. Delete ALL companies
    const delCompanies = await client.query('DELETE FROM ptj.companies');
    console.log('Deleted ' + delCompanies.rowCount + ' companies');

    console.log('\nCleanup complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
