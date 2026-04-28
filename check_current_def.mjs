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
    
    const funcName = "trigger_moderate_post";
    console.log(`Checking current definition of ${funcName}...`);
    
    const res = await client.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1
      AND n.nspname = 'public';
    `, [funcName]);
    
    if (res.rows.length > 0) {
      console.log("Function Definition:");
      console.log(res.rows[0].def);
    } else {
      console.log("Function not found.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
