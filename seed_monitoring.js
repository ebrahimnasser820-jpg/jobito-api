const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log('🔌 Connected to PostgreSQL Database on Supabase.');

  const reports = [
    {
      errorType: 'Database Connection Issue',
      description: 'ECONNREFUSED: Connection refused at aws-1-eu-north-1.pooler.supabase.com:6543. Max client connections reached (pool size: 100). Please check pg_stat_activity.',
      frequency: 32,
      severity: 'HIGH',
      suggestedSolution: 'Increase connection pool size using PgBouncer or scale up Postgres database instances to handle higher concurrent connections.',
      metadata: JSON.stringify({ db_host: 'aws-1-eu-north-1.pooler.supabase.com', pool_max: 100, current_connections: 104, timestamp: new Date().toISOString() })
    },
    {
      errorType: 'Server Internal Error',
      description: 'TypeError: Cannot read properties of undefined (reading \'fullName\') at UsersService.updateProfile (src/users/users.service.ts:182:31) for request user sub usr_2384a1',
      frequency: 8,
      severity: 'MEDIUM',
      suggestedSolution: 'Add proper optional chaining (user?.fullName) and validations before attempting to access nested fields of a user entity that may not exist in the database.',
      metadata: JSON.stringify({ route: 'PUT /users/me', userId: 'usr_2384a1', payload: { full_name: null }, timestamp: new Date().toISOString() })
    },
    {
      errorType: 'Authentication Failure',
      description: 'JsonWebTokenError: jwt expired. Token expired at 2026-05-26T14:10:00Z. Time drift detected between client and server.',
      frequency: 45,
      severity: 'LOW',
      suggestedSolution: 'Inform the client to clear session and re-authenticate. Ensure the client\'s local system time is synchronized using NTP.',
      metadata: JSON.stringify({ token_type: 'Bearer', expiration_time: '2026-05-26T14:10:00Z', timestamp: new Date().toISOString() })
    },
    {
      errorType: 'Resource Not Found',
      description: 'NotFoundException: Job advertisement with ID 40582 does not exist in \'ptj.jobs\' table.',
      frequency: 12,
      severity: 'LOW',
      suggestedSolution: 'Verify if the frontend application is calling the correct job ID. Ensure that jobs deleted by companies are filtered out from search indices.',
      metadata: JSON.stringify({ route: 'GET /jobs/40582', referrer: 'https://jobito.com/search', timestamp: new Date().toISOString() })
    },
    {
      errorType: 'Server Internal Error',
      description: 'InternalServerErrorException: Simulated 500 error for monitoring test in AppModule.',
      frequency: 21,
      severity: 'HIGH',
      suggestedSolution: 'Investigate backend logs or disable testing filters that might be causing simulated server errors in production code.',
      metadata: JSON.stringify({ simulated: true, testType: '500', timestamp: new Date().toISOString() })
    }
  ];

  try {
    // 1. Check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'ptj' 
        AND table_name = 'monitoring_reports'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table ptj.monitoring_reports does not exist. Please check your database migrations.');
      return;
    }

    console.log('✅ Table ptj.monitoring_reports exists. Inserting fake data...');

    // 2. Insert reports
    for (const report of reports) {
      await client.query(`
        INSERT INTO ptj.monitoring_reports (error_type, description, frequency, severity, suggested_solution, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        report.errorType,
        report.description,
        report.frequency,
        report.severity,
        report.suggestedSolution,
        report.metadata
      ]);
      console.log(`🔹 Inserted report: [${report.severity}] ${report.errorType}`);
    }

    console.log('🎉 Successfully seeded fake monitoring reports data for Operations Monitor!');
  } catch (err) {
    console.error('❌ Database insertion error:', err);
  } finally {
    await client.end();
  }
}

main();
