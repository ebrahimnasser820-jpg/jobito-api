const { Client } = require('pg');

async function searchEmails() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jobito',
    password: 'mlpoknbv',
    port: 5432,
  });

  const emails = [
    'mohamednasseremam3@gmil.com',
    'mohamednasseremam3@gmail.com',
    'mohamednasseremam380@gmil.com',
    'mohamednasseremam380@gmail.com'
  ];

  try {
    await client.connect();
    
    console.log('--- Searching in ptj.admins ---');
    for (const email of emails) {
      const res = await client.query('SELECT full_name, email, role FROM ptj.admins WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        console.log(`Found in admins: ${email}`);
        console.table(res.rows);
      }
    }

    console.log('\n--- Searching in users ---');
    for (const email of emails) {
      const res = await client.query('SELECT full_name, email FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        console.log(`Found in users: ${email}`);
        console.table(res.rows);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

searchEmails();
