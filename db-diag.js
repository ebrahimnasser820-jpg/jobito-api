const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mlpoknbv',
  database: process.env.DB_NAME || 'jobito',
};

async function check() {
  const client = new Client(config);
  let log = `Diagnostic started at ${new Date().toISOString()}\n`;
  log += `Config: ${JSON.stringify({...config, password: '****'}, null, 2)}\n`;
  
  try {
    await client.connect();
    log += "Successfully connected to PostgreSQL!\n";
    const res = await client.query("SELECT current_database(), current_user, version()");
    log += `DB Info: ${JSON.stringify(res.rows[0], null, 2)}\n`;
    await client.end();
  } catch (err) {
    log += `CONNECTION ERROR: ${err.message}\n`;
    log += `Stack: ${err.stack}\n`;
  }
  
  fs.writeFileSync('db-diag-log.txt', log);
  console.log("Logged to db-diag-log.txt");
}

check();
