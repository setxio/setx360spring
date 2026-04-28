process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
    
    console.log("Checking signature of net.http_post...");
    const res = await client.query(`
      SELECT 
        p.proname, 
        pg_get_function_arguments(p.oid) as args,
        n.nspname as schema
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'http_post'
      AND n.nspname = 'net';
    `);
    
    if (res.rows.length > 0) {
      res.rows.forEach(r => {
        console.log(`\nSchema: ${r.schema}, Name: ${r.proname}`);
        console.log(`Args: ${r.args}`);
      });
    } else {
      console.log("net.http_post not found. Checking other schemas...");
      const res2 = await client.query(`
        SELECT n.nspname, p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'http_post';
      `);
      res2.rows.forEach(r => {
        console.log(`\nSchema: ${r.nspname}, Name: ${r.proname}`);
        console.log(`Args: ${r.args}`);
      });
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
