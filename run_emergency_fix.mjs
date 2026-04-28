process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import fs from 'fs';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
const sqlPath = "c:\\Users\\montg\\OneDrive\\Desktop\\social market\\supabase\\emergency_fix.sql";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log("Executing Emergency Fix SQL...");
    
    await client.query(sql);
    console.log("Emergency Fix executed successfully! Triggers dropped.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
