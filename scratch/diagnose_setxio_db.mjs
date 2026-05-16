// Targeted diagnosis of setx.io database schema for signup fix
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const URL = 'https://uhxplehweftziixhjpgn.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeHBsZWh3ZWZ0emlpeGhqcGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzMDM2MSwiZXhwIjoyMDkzNjA2MzYxfQ.m4VVAWy8ZF6cntpyUpfpuWkMQHcMMuaFoaRTKCwSgfg';
const h = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function run() {
  // 1. Get sites table columns
  console.log('=== SITES TABLE COLUMNS ===');
  const r1 = await fetch(`${URL}/rest/v1/sites?select=*&limit=0`, { headers: { ...h, 'Prefer': 'count=exact' } });
  console.log('Sites status:', r1.status, '| Count:', r1.headers.get('content-range'));
  // Get one row to see column shape
  const r1b = await fetch(`${URL}/rest/v1/sites?select=*&limit=1`, { headers: h });
  if (r1b.ok) {
    const data = await r1b.json();
    if (data.length > 0) {
      console.log('Sites columns:', Object.keys(data[0]).join(', '));
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Sites table is empty - checking columns via OPTIONS...');
    }
  }

  // 2. Get profiles table columns
  console.log('\n=== PROFILES TABLE COLUMNS ===');
  const r2 = await fetch(`${URL}/rest/v1/profiles?select=*&limit=1`, { headers: h });
  if (r2.ok) {
    const data = await r2.json();
    if (data.length > 0) {
      console.log('Profiles columns:', Object.keys(data[0]).join(', '));
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Profiles table is empty');
    }
  }

  // 3. Check products table
  console.log('\n=== PRODUCTS TABLE ===');
  const r3 = await fetch(`${URL}/rest/v1/products?select=*&limit=1`, { headers: h });
  console.log('Products status:', r3.status);
  if (r3.ok) {
    const data = await r3.json();
    if (data.length > 0) console.log('Products columns:', Object.keys(data[0]).join(', '));
    else console.log('Products empty');
  }

  // 4. Check if handle_new_user trigger exists by trying a test signup
  // Instead, check the auth users count
  console.log('\n=== AUTH USERS ===');
  const r4 = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=5`, { 
    headers: { ...h, 'apikey': KEY }
  });
  if (r4.ok) {
    const data = await r4.json();
    console.log('Total auth users:', data.total || data.users?.length || 'unknown');
    if (data.users) {
      data.users.forEach(u => console.log(`  - ${u.email} (${u.id}) created: ${u.created_at}`));
    }
  } else {
    console.log('Auth admin status:', r4.status);
  }

  // 5. Check what columns are expected - try inserting with bad data to see errors
  console.log('\n=== SITES TABLE DEFINITION (via empty insert error) ===');
  const r5 = await fetch(`${URL}/rest/v1/sites`, {
    method: 'POST',
    headers: { ...h, 'Prefer': 'return=representation' },
    body: JSON.stringify({ _test: true }) // Will fail but show column info
  });
  console.log('Sites insert test status:', r5.status);
  const r5text = await r5.text();
  console.log('Error:', r5text.substring(0, 500));
}

run().catch(e => console.error(e));
