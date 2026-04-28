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
    
    console.log("Searching for all versions of trigger_classify_post and trigger_moderate_post...");
    const res = await client.query(`
      SELECT 
        n.nspname as schema, 
        p.proname as name, 
        pg_get_function_arguments(p.oid) as args,
        pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN ('trigger_classify_post', 'trigger_moderate_post', 'trigger_follow_suggestions');
    `);
    
    console.log(`Found ${res.rows.length} function versions:`);
    for (const r of res.rows) {
      console.log(`\n--- Schema: ${r.schema}, Name: ${r.name}, Args: ${r.args} ---`);
      // console.log(r.def);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
