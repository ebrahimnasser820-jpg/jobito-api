
const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("Connected to database. Adding missing columns to ptj.companies...");
    
    // Add columns if they don't exist
    const queries = [
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS website VARCHAR(255)",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS foundedday VARCHAR(50)",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS foundedmonth VARCHAR(50)",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS foundedyear VARCHAR(50)",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS name_en VARCHAR(255)",
      "ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS description_en TEXT"
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        console.log(`Executed: ${query}`);
      } catch (e) {
        console.error(`Failed: ${query}`, e.message);
      }
    }
    
    console.log("Schema update completed successfully.");
  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
