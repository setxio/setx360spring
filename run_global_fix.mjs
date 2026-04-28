process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import fs from 'fs';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
const sqlPath = "supabase/global_http_fix_v4.sql";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    
    const path = process.argv[2] || 'supabase/global_http_fix_v4.sql';
    console.log(`Executing SQL from ${path}...`);
    const sql = fs.readFileSync(path, 'utf8');
    
    await client.query(sql);
    console.log("Global Fix executed successfully!");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
