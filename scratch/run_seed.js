const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync(path.join(__dirname, 'seed_admin.sql'), 'utf8');
    await client.query(sql);
    console.log('Admin user seeded successfully!');
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  } finally {
    await client.end();
  }
}

seed();
