const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
});

console.log('Testing PostgreSQL connection...');
client.connect()
    .then(() => {
        console.log('✅ Success! Connected to PostgreSQL.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed! PostgreSQL connection error:', err.message);
        process.exit(1);
    });
