import pg from 'pg';

const connectionString = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function run() {
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    
    console.log("Searching for net.http_post in ALL functions (excluding aggregates)...");
    const res = await client.query(`
      SELECT n.nspname, p.proname, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.prokind != 'a' -- Skip aggregate functions
      AND pg_get_functiondef(p.oid) ILIKE '%net.http_post%';
    `);
    
    console.log(`Found ${res.rows.length} functions calling net.http_post:`);
    for (const r of res.rows) {
      console.log(`\n--- Schema: ${r.nspname}, Name: ${r.proname} ---`);
      console.log(r.def);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
