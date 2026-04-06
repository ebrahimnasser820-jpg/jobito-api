const { Client } = require('pg');

async function checkCategories() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
  });
  try {
    await client.connect();
    
    console.log("--- Checking Table Structure: ptj.categories ---");
    const colRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'ptj' AND table_name = 'categories'");
    colRes.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    
    console.log("\n--- Checking Table Data: ptj.categories ---");
    const dataRes = await client.query("SELECT * FROM ptj.categories");
    console.log(`Total rows: ${dataRes.rowCount}`);
    dataRes.rows.forEach(row => console.log(JSON.stringify(row)));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkCategories();
