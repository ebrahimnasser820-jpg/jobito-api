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
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected successfully!');
    
    const users = await AppDataSource.query('SELECT user_id, full_name, email, location FROM ptj.users LIMIT 5');
    console.log('USERS:', JSON.stringify(users, null, 2));
    
    const tables = await AppDataSource.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ptj'");
    console.log('TABLES in ptj:', tables.map(t => t.table_name).join(', '));
    
    await AppDataSource.destroy();
  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

check();
