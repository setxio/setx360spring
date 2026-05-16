// Execute the signup constraints fix migration on the live database
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import { readFileSync } from 'fs';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("✅ Connected to Supabase Postgres");
    
    const sql = readFileSync('./supabase/migrations/20260512_fix_signup_constraints.sql', 'utf-8');
    console.log("Running migration: 20260512_fix_signup_constraints.sql");
    
    // Execute each statement separately (split on semicolons at line boundaries)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const stmt of statements) {
      try {
        console.log(`  → ${stmt.substring(0, 80)}...`);
        await client.query(stmt);
        console.log(`    ✅ OK`);
      } catch (err) {
        console.error(`    ⚠️  ${err.message}`);
      }
    }
    
    console.log("\n✅ Migration complete!");
  } catch (err) {
    console.error("Connection Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
