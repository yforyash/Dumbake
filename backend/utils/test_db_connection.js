const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  let pool;

  if (databaseUrl) {
    console.log('DATABASE_URL is set. Testing cloud database connection...');
    console.log('Database URL configured:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') || databaseUrl.includes('neon') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    });
  } else {
    console.log('DATABASE_URL is not set in backend/.env.');
    console.log('Testing local PostgreSQL database connection instead using local environment variables...');
    console.log(`Connection Config: user=${process.env.DB_USER || 'postgres'}, host=${process.env.DB_HOST || 'localhost'}, database=${process.env.DB_DATABASE || 'Dumbake'}, port=${process.env.DB_PORT || '5432'}`);
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'Dumbake',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  try {
    const res = await pool.query('SELECT NOW(), version()');
    console.log('\nSUCCESS: Connected to PostgreSQL database!');
    console.log('Current Database Time:', res.rows[0].now);
    console.log('PostgreSQL Version:', res.rows[0].version);

    // List all tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nFound tables in public schema:');
    if (tableRes.rows.length === 0) {
      console.log('No tables found. Schema may not be initialized yet.');
    } else {
      tableRes.rows.forEach(row => {
        console.log(` - ${row.table_name}`);
      });
    }
  } catch (err) {
    console.error('\nERROR: Failed to connect to database or query tables!');
    console.error(err.stack || err.message || err);
  } finally {
    await pool.end();
  }
}

testConnection();
