const { Client } = require('pg');

async function apply() {
  const client = new Client({
    connectionString: 'postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    const sql = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dismissed_bubbles JSONB DEFAULT '{}'::jsonb;`;
    await client.query(sql);
    
    console.log('Added dismissed_bubbles column successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

apply();
