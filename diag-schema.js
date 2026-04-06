
const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("Connected.");
    
    // Check columns in companies
    const companyCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'companies'
    `);
    console.log("Companies columns:", companyCols.rows.map(r => r.column_name).join(', '));
    
    // Check columns in jobs
    const jobCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'ptj' AND table_name = 'jobs'
    `);
    console.log("Jobs columns:", jobCols.rows.map(r => r.column_name).join(', '));
    
    // Check a sample joined query
    const sample = await client.query(`
      SELECT j.job_id, j.title, c.name as comp_name
      FROM ptj.jobs j
      LEFT JOIN ptj.companies c ON j.company_id = c.company_id
      LIMIT 1
    `);
    console.log("Sample join result:", JSON.stringify(sample.rows[0], null, 2));

  } catch (err) {
    console.error("Diagnostic failed:", err.message);
  } finally {
    await client.end();
  }
}

check();
