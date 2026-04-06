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

        const queries = [
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "name_en" VARCHAR(255);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
            'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS "title_en" VARCHAR(255);',
            'ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS "description_en" TEXT;'
        ];

        for (const query of queries) {
            try {
                await client.query(query);
                console.log(`Executed: ${query}`);
            } catch (e) {
                console.error(`Error executing query: ${query}`, e.message);
            }
        }

        console.log('✅ DB Localization columns added/checked.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating DB:', err.message);
        process.exit(1);
    }
}

run();
