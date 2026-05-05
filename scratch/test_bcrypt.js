const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function testLogin() {
  const client = new Client({
    user: 'postgres', host: 'localhost', database: 'jobito',
    password: 'mlpoknbv', port: 5432,
  });

  const email = 'mohamednasseremam3@gmail.com';
  const rawPassword = 'mlpoknbv';

  try {
    await client.connect();
    const res = await client.query("SELECT password_hash FROM ptj.admins WHERE email = $1", [email]);
    
    if (res.rows.length === 0) {
      console.log('❌ User not found in ptj.admins');
      return;
    }

    const hash = res.rows[0].password_hash;
    console.log('Found Hash:', hash);

    const isValid = await bcrypt.compare(rawPassword, hash);
    console.log('Is Password Valid?', isValid);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

testLogin();
