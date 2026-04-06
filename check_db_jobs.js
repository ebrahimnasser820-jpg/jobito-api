const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

async function checkJobs() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const resCount = await client.query('SELECT COUNT(*) FROM ptj.jobs');
    console.log('TOTAL JOBS COUNT:', resCount.rows[0].count);
    
    const resJobs = await client.query('SELECT job_id, title, is_active FROM ptj.jobs LIMIT 5');
    console.log('SAMPLE JOBS:', resJobs.rows);
    
    await client.end();
  } catch (err) {
    console.error('DB ERROR:', err.message);
    process.exit(1);
  }
}

checkJobs();
