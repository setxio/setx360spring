const { Client } = require('pg');
const CONNECTION_STRING = 'postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function check() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const tables = ['bridge_items', 'partner_csm_tenants', 'webhook_dlq', 'whisper_insights', 'merchant_subscriptions', 'bookings'];
    for (const table of tables) {
      const { rows } = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');`);
      console.log(`Table ${table} exists: ${rows[0].exists}`);
    }
    const { rows: triggers } = await client.query(`SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'bridge_items';`);
    console.log('Bridge items triggers:', triggers.map(t => t.trigger_name));
    
    const { rows: rpcs } = await client.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('get_csm_api_key', 'provision_csm_api_key', 'onboard_csm_tenant');`);
    console.log('RPC functions:', rpcs.map(r => r.routine_name));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
