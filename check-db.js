const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mlpoknbv',
  database: process.env.DB_NAME || 'jobito',
});

async function check() {
  try {
    await AppDataSource.initialize();
    const result = await AppDataSource.query('SELECT count(*) FROM ptj.translations');
    console.log('TRANS_COUNT:', result[0].count);
    const rows = await AppDataSource.query('SELECT * FROM ptj.translations LIMIT 5');
    console.log('ROWS:', JSON.stringify(rows, null, 2));
    await AppDataSource.destroy();
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

check();
