const { Client } = require('pg');
const fs = require('fs');

async function apply() {
  const client = new Client({
    connectionString: 'postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    const sql = fs.readFileSync('supabase/migrations/20260505_seed_premium_market.sql', 'utf8');
    await client.query(sql);
    
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

apply();
