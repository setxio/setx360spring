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
    
    // Check if gig_worker_profiles exists
    const checkRes = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gig_worker_profiles'`);
    if (checkRes.rows.length === 0) {
      console.log("Applying gig_tools.sql...");
      const sql = fs.readFileSync('supabase/migrations/20260607_gig_tools.sql', 'utf8');
      await client.query(sql);
    }

    console.log("Adding payment handles columns...");
    await client.query(`
      ALTER TABLE public.gig_worker_profiles 
      ADD COLUMN IF NOT EXISTS cash_app_handle TEXT, 
      ADD COLUMN IF NOT EXISTS zelle_handle TEXT;
    `);
    
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
