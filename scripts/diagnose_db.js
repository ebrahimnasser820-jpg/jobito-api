const { Client } = require('pg');

async function diagnose() {
  console.log('Starting diagnostic script...');
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jobito',
    password: 'mlpoknbv',
    port: 5432,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully.');

    // Check companies table
    console.log('\nChecking companies table:');
    const resCompanies = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'");
    console.log(resCompanies.rows);

    // Check jobs table
    console.log('\nChecking jobs table:');
    const resJobs = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs'");
    console.log(resJobs.rows);

    await client.end();
    console.log('\nDiagnostic finished.');
  } catch (err) {
    console.error('Error during diagnosis:', err.stack);
    process.exit(1);
  }
}

diagnose();
