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
    
    const funcName = "trigger_check_buying_intent";
    console.log(`Searching for ${funcName} in all schemas...`);
    
    const res = await client.query(`
      SELECT n.nspname, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1;
    `, [funcName]);
    
    if (res.rows.length > 0) {
      res.rows.forEach(r => {
        console.log(`\nSchema: ${r.nspname}`);
        console.log("Function Definition:");
        console.log(r.def);
      });
    } else {
      console.log("Function not found anywhere.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
