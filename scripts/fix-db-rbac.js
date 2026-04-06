const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'jobito',
  password: 'mlpoknbv',
  port: 5432,
});

const sql = `
  -- Add missing columns to ptj.jobs
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS slots_available INT DEFAULT 1;
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS price_type VARCHAR(50) DEFAULT 'fixed';
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT FALSE;
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_min NUMERIC(10,2);
  ALTER TABLE ptj.jobs ADD COLUMN IF NOT EXISTS salary_max NUMERIC(10,2);

  -- Add missing columns to ptj.companies
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
  ALTER TABLE ptj.companies ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

  -- RBAC Tables
  CREATE TABLE IF NOT EXISTS ptj.roles (
    role_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS ptj.permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    UNIQUE(action, entity)
  );

  CREATE TABLE IF NOT EXISTS ptj.role_permissions (
    role_id BIGINT REFERENCES ptj.roles(role_id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES ptj.permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS ptj.audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES ptj.users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
  );

  -- Seed Initial RBAC Data
  INSERT INTO ptj.roles (name, description) 
  VALUES ('admin', 'Full access'), ('manager', 'Manage jobs'), ('company', 'Store jobs'), ('student', 'Apply')
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO ptj.permissions (action, entity) 
  VALUES ('CREATE', 'JOB'), ('READ', 'JOB'), ('UPDATE', 'JOB'), ('DELETE', 'JOB')
  ON CONFLICT DO NOTHING;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query(sql);
    console.log('Database schema and RBAC tables updated successfully');
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
