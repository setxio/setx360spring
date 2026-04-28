import pg from 'pg';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('stores', 'products', 'jobs', 'vehicles', 'properties', 'events') 
      AND table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log("Columns for other tables:");
    res.rows.forEach(r => console.log(r.table_name, r.column_name, r.data_type));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
