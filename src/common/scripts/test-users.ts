const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:mlpoknbv@localhost:5432/jobito'
});

async function checkUsers() {
    await client.connect();
    const res = await client.query('SELECT email, is_active, google_id FROM users');
    console.log('--- USERS IN DB ---');
    res.rows.forEach(r => console.log(r));
    console.log('-------------------');
    await client.end();
}

checkUsers().catch(console.error);
