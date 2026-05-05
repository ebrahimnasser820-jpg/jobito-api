const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  const client = new Client({
    user: 'postgres', host: 'localhost', database: 'jobito',
    password: 'mlpoknbv', port: 5432,
  });

  const email = 'mohamednasseremam3@gmail.com';
  const password = 'mlpoknbv';
  const fullName = 'محمد ناصر محمد محمد امام';

  try {
    await client.connect();
    
    // Hash the password properly using bcryptjs (same as service)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Generated Hash:', hash);

    // Upsert admin
    await client.query(`
      INSERT INTO ptj.admins (full_name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, 'super_admin', true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW();
    `, [fullName, email, hash]);

    // Also delete any old ones if they exist with the wrong spelling to avoid confusion
    await client.query("DELETE FROM ptj.admins WHERE email != $1", [email]);

    console.log('✅ Admin account updated successfully to:', email);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixAdmin();
