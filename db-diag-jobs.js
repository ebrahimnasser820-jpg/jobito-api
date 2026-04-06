
const { Client } = require('pg');

async function diag() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("Connected to database.");
    
    const jobsCount = await client.query("SELECT COUNT(*) FROM ptj.jobs");
    console.log("Total Jobs count:", jobsCount.rows[0].count);
    
    if (jobsCount.rows[0].count > 0) {
      const sampleJob = await client.query(`
        SELECT j.job_id, j.title, c.name as company_name 
        FROM ptj.jobs j 
        LEFT JOIN ptj.companies c ON j.company_id = c.company_id 
        LIMIT 1
      `);
      console.log("Sample Job:", JSON.stringify(sampleJob.rows[0], null, 2));
    } else {
      console.log("No jobs found in database.");
    }
  } catch (err) {
    console.error("Database Error:", err.message);
  } finally {
    await client.end();
  }
}

diag();
