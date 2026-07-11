import fs from 'fs';
import { execSync } from 'child_process';
const sql = fs.readFileSync('game_scores_schema.sql', 'utf8');
import pg from 'pg';
const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function run() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
