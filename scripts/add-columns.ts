import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'mlpoknbv',
  database: 'jobito',
});

async function run() {
  try {
    await AppDataSource.initialize();
    console.log("Connected to DB.");
    
    // Add columns if they don't exist
    await AppDataSource.query(`ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS tech_stack JSONB;`);
    console.log("Added tech_stack column.");
    
    await AppDataSource.query(`ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS location_tags JSONB;`);
    console.log("Added location_tags column.");

  } catch (error) {
    console.error("Error modifying database:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
