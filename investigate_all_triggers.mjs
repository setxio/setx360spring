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
    
    console.log("Listing trigger functions for all posts triggers...");
    const res = await client.query(`
      SELECT 
        trigger_name, 
        event_object_table, 
        action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'posts';
    `);
    
    for (const r of res.rows) {
      console.log(`\nTrigger: ${r.trigger_name}`);
      console.log(`Action: ${r.action_statement}`);
      
      // Extract function name from action_statement (e.g. EXECUTE FUNCTION public.foo())
      const match = r.action_statement.match(/EXECUTE (?:FUNCTION|PROCEDURE) ([\w\.]+)/i);
      if (match) {
        const funcName = match[1];
        console.log(`Investigating function: ${funcName}`);
        const [schema, name] = funcName.includes('.') ? funcName.split('.') : ['public', funcName];
        
        const funcRes = await client.query(`
          SELECT routine_definition 
          FROM information_schema.routines 
          WHERE routine_name = $1 
          AND routine_schema = $2;
        `, [name, schema]);
        
        if (funcRes.rows.length > 0) {
          console.log("Source:");
          console.log(funcRes.rows[0].routine_definition);
        } else {
          console.log("Source not found in information_schema.routines.");
        }
      }
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
