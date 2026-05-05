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
    const res = await client.query("SELECT email, password_hash FROM ptj.admins WHERE email = $1", [email]);
    
    if (res.rows.length === 0) {
      console.log('❌ Admin not found');
      return;
    }

    const hash = res.rows[0].password_hash;
    console.log('Email:', res.rows[0].email);
    console.log('Hash:', hash);
    console.log('Hash length:', hash.length);

    const isValid = await bcrypt.compare(rawPassword, hash);
    console.log('Password "mlpoknbv" valid?', isValid);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

testLogin();
