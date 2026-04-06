
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function run() {
  try {
    console.log('--- DB SEED START ---');
    await client.connect();
    console.log('CONNECTED');
    
    await client.query('SET search_path TO ptj, public;');
    console.log('SCHEMA SET');

    const check = await client.query('SELECT COUNT(*) FROM categories;');
    console.log('Initial category count:', check.rows[0].count);

    const categories = [
      ['تكنولوجيا', 'Technology'],
      ['تصميم', 'Design'],
      ['تسويق', 'Marketing'],
      ['مبيعات', 'Sales']
    ];

    for (const [name, nameEn] of categories) {
      console.log(`Inserting: ${name}...`);
      await client.query(
        'INSERT INTO categories (name, name_en) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING;',
        [name, nameEn]
      );
    }

    const final = await client.query('SELECT * FROM categories;');
    console.log('Final categories:', final.rows.length);
    console.log('Category IDs:', final.rows.map(r => r.category_id).join(', '));
    
    console.log('--- DB SEED END ---');
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
 Riverside, MO
