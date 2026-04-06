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
    process.stdout.write('Connecting to PostgreSQL...\n');
    try {
        await client.connect();
        process.stdout.write('✅ Connected.\n');

        const alters = [
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "website" VARCHAR(255);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "employees" VARCHAR(50);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "industry" VARCHAR(100);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedDay" VARCHAR(50);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedMonth" VARCHAR(50);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "foundedYear" VARCHAR(50);',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;',
            'ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS "benefits" JSONB;'
        ];

        for (const sql of alters) {
            process.stdout.write(`Executing: ${sql}\n`);
            await client.query(sql);
        }

        process.stdout.write('✅ Schema update complete!\n');
    } catch (err) {
        process.stderr.write(`❌ Error: ${err.message}\n`);
    } finally {
        await client.end();
        process.stdout.write('Terminating.\n');
        process.exit(0);
    }
}

run();
