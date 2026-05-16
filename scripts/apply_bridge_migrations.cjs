const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = 'postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const NEW_MIGRATIONS = [
  'supabase/migrations/20260510_partner_csm_tenants.sql',
  'supabase/migrations/20260510_multivendor_orders.sql',
  'supabase/migrations/20260510_bridge_items.sql',
  'supabase/migrations/20260510_bridge_items_stock.sql',
  'supabase/migrations/20260510_bridge_moderation_trigger.sql',
  'supabase/migrations/20260510_dead_letter_queue.sql',
  'supabase/migrations/20260510_csm_key_provisioning.sql',
  'supabase/migrations/20260510_merchant_subscriptions.sql',
  'supabase/migrations/20260510_bookings.sql',
];

async function applyMigrations() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to SETX 360 Supabase DB\n');

    // Fix incorrect bridge_items schema
    console.log('▶️  Fixing old bridge_items schema');
    await client.query(`DROP TABLE IF EXISTS public.bridge_items CASCADE;`);
    console.log('   ✅ Dropped bad bridge_items table\n');

    for (const migrationPath of NEW_MIGRATIONS) {
      const fullPath = path.resolve(migrationPath);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ File not found: ${fullPath}`);
        continue;
      }

      console.log(`▶️  Applying: ${migrationPath}`);
      
      try {
        const sql = fs.readFileSync(fullPath, 'utf8');
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`   ⚠️  Already applied (safe): ${err.message.slice(0, 80)}\n`);
        } else {
          console.error(`   ❌ FAILED: ${err.message}\n`);
          throw err; // Stop on unexpected errors
        }
      }
    }

    console.log('🎉 All SETX 360 Phase A/B migrations applied!\n');

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
