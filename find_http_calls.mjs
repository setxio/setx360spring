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
    
    console.log("Searching for net.http_post in all functions...");
    const res = await client.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_definition LIKE '%net.http_post%' 
      AND routine_schema = 'public';
    `);
    
    console.log(`Found ${res.rows.length} functions calling net.http_post:`);
    res.rows.forEach(r => console.log(`- ${r.routine_name}`));

    // Print definitions for all of them
    for (const r of res.rows) {
      console.log(`\n--- Definition of ${r.routine_name} ---`);
      console.log(r.routine_definition);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
