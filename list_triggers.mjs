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
    
    console.log("Listing triggers on public.posts...");
    const res = await client.query(`
      SELECT trigger_name, action_statement, action_timing, event_manipulation
      FROM information_schema.triggers 
      WHERE event_object_table = 'posts' 
      AND event_object_schema = 'public';
    `);
    
    console.log("Triggers found:");
    res.rows.forEach(r => console.log(`- ${r.trigger_name} (${r.action_timing} ${r.event_manipulation})`));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
