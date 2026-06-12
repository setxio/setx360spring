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
    
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'driver_status', 'driver_payroll_streams', 'events', 
        'tickets', 'civic_reports', 'volunteer_shifts'
      );
    `;
    const res = await client.query(query);
    console.log("Newly created tables found:");
    console.log(res.rows.map(r => r.table_name));

    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      AND column_name IN ('is_refunds_enabled', 'business_hours', 'delivery_zones', 'pos_integration_keys');
    `;
    const colsRes = await client.query(columnsQuery);
    console.log("\nNew columns in stores table found:");
    console.log(colsRes.rows.map(r => r.column_name));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
