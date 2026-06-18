process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import fs from 'fs';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const query = fs.readFileSync('pro_schema.sql', 'utf8');
    console.log("Running SQL script...");
    const res = await client.query(query);
    console.log("Success! Tables created/updated.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
