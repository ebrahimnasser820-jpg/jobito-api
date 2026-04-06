const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mlpoknbv',
    database: process.env.DB_NAME || 'jobito',
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL.');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ptj' AND table_name = 'companies';
        `);
        console.log('Columns in companies table:');
        console.table(res.rows);

        const companyRes = await client.query('SELECT company_id, name, contact_email FROM ptj.companies LIMIT 5;');
        console.log('\nSample items:');
        console.table(companyRes.rows);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking DB:', err.message);
        process.exit(1);
    }
}

run();
