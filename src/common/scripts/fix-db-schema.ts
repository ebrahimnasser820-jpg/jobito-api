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

        const columnsToAdd = [
            ['website', 'VARCHAR(255)'],
            ['employees', 'VARCHAR(50)'],
            ['industry', 'VARCHAR(100)'],
            ['foundedDay', 'VARCHAR(50)'],
            ['foundedMonth', 'VARCHAR(50)'],
            ['foundedYear', 'VARCHAR(50)'],
            ['socialLinks', 'JSONB'],
            ['benefits', 'JSONB']
        ];

        for (const [col, type] of columnsToAdd) {
            try {
                await client.query(`ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "${col}" ${type};`);
                console.log(`Column "${col}" checked/added.`);
            } catch (e) {
                console.error(`Error adding column ${col}:`, e.message);
            }
        }

        console.log('✅ DB Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating DB:', err.message);
        process.exit(1);
    }
}

run();
