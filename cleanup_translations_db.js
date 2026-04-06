
const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/jobito"
  });
  try {
    await client.connect();
    console.log("Connected to database. Removing translation columns...");
    
    const queries = [
      // Remove translation columns from companies
      "ALTER TABLE ptj.companies DROP COLUMN IF EXISTS name_en",
      "ALTER TABLE ptj.companies DROP COLUMN IF EXISTS description_en",
      // Remove translation columns from jobs
      "ALTER TABLE ptj.jobs DROP COLUMN IF EXISTS title_en",
      "ALTER TABLE ptj.jobs DROP COLUMN IF EXISTS description_en",
      // Remove translation columns from categories
      "ALTER TABLE ptj.categories DROP COLUMN IF EXISTS name_en",
      "ALTER TABLE ptj.categories DROP COLUMN IF EXISTS description_en"
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        console.log(`Executed: ${query}`);
      } catch (e) {
        console.error(`Failed: ${query}`, e.message);
      }
    }
    
    console.log("Database schema cleaned successfully.");
  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
