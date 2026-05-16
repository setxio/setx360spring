// Execute the signup RLS fix on the setx.io database
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const URL = 'https://uhxplehweftziixhjpgn.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeHBsZWh3ZWZ0emlpeGhqcGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzMDM2MSwiZXhwIjoyMDkzNjA2MzYxfQ.m4VVAWy8ZF6cntpyUpfpuWkMQHcMMuaFoaRTKCwSgfg';

const statements = [
  `CREATE POLICY "Authenticated users can create sites" ON sites FOR INSERT TO authenticated WITH CHECK (true)`,
  `CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid())`,
  `CREATE POLICY "Users can view their own profile by id" ON profiles FOR SELECT TO authenticated USING (id = auth.uid())`,
  `CREATE POLICY "Authenticated users can insert site_blocks" ON site_blocks FOR INSERT TO authenticated WITH CHECK (true)`,
  `NOTIFY pgrst, 'reload schema'`
];

async function run() {
  for (const sql of statements) {
    const label = sql.substring(0, 80);
    try {
      const res = await fetch(`${URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`,
        },
        body: JSON.stringify({})
      });
      // REST API can't run DDL — use the SQL API instead
    } catch (e) {}
  }
  
  // Use the pg_net approach or direct SQL execution
  // Since we can't run DDL via REST, let's use the Supabase Management API
  const projectRef = 'uhxplehweftziixhjpgn';
  const fullSql = statements.join(';\n');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ query: fullSql })
  });
  
  if (res.ok) {
    console.log('✅ Migration executed via Management API');
    console.log(await res.json());
  } else {
    console.log('Management API status:', res.status);
    console.log(await res.text());
    console.log('\n⚠️ Please run the SQL manually in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/uhxplehweftziixhjpgn/sql/new');
    console.log('\nSQL to run:');
    console.log(fullSql);
  }
}

run().catch(e => console.error(e));
