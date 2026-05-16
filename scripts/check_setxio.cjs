const { Client } = require('pg');

const CONNECTION_STRING = 'postgres://postgres.uhxplehweftziixhjpgn:J53V7CriZZj8Zu0u@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function check() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const tables = ['sync_queue', 'appointments', 'sites'];
    for (const table of tables) {
      const { rows } = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');`);
      console.log(`Table ${table} exists: ${rows[0].exists}`);
    }
    const { rows: siteCols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sites';`);
    console.log('Sites columns:', siteCols.map(r => r.column_name));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

check();
