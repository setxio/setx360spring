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
    console.log("Connected to DB.");

    // Transaction for Vendor & Merchant Logic
    await client.query('BEGIN');

    // 1. Extend Stores
    await client.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS is_refunds_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS refund_window_days INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS business_hours JSONB,
      ADD COLUMN IF NOT EXISTS delivery_zones JSONB,
      ADD COLUMN IF NOT EXISTS pos_integration_keys JSONB;
    `);
    console.log("Stores table updated.");

    // 2. Driver Status & Payroll
    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        is_on_duty BOOLEAN DEFAULT false,
        current_lat NUMERIC(10, 8),
        current_lng NUMERIC(11, 8),
        capacity_status VARCHAR(50) DEFAULT 'available',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS driver_payroll_streams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        rate_per_second NUMERIC(10, 4) DEFAULT 0.0055,
        balance_earned NUMERIC(10, 2) DEFAULT 0.00,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Driver logistics tables created.");

    // 3. Creator Events & Tickets
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP WITH TIME ZONE,
        location VARCHAR(255),
        ticket_price NUMERIC(10, 2) DEFAULT 0.00,
        total_tickets INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        purchaser_id UUID REFERENCES profiles(id),
        qr_code_hash VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'valid',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Creator event tables created.");

    // 4. Civic & Ministry
    await client.query(`
      CREATE TABLE IF NOT EXISTS civic_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES profiles(id),
        category VARCHAR(100),
        description TEXT,
        lat NUMERIC(10, 8),
        lng NUMERIC(11, 8),
        status VARCHAR(50) DEFAULT 'open',
        department_assigned VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS volunteer_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ministry_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        volunteer_id UUID REFERENCES profiles(id),
        shift_date TIMESTAMP WITH TIME ZONE,
        role VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Civic & Ministry tables created.");

    // Implement B2B Transfer SQL Function (Transaction handled in PG)
    await client.query(`
      CREATE OR REPLACE FUNCTION b2b_mesh_transfer(
        sender_wallet_id UUID,
        receiver_wallet_id UUID,
        transfer_amount NUMERIC
      ) RETURNS VOID AS $$
      BEGIN
        -- Deduct from sender
        UPDATE fintech_wallets
        SET balance = balance - transfer_amount
        WHERE id = sender_wallet_id AND balance >= transfer_amount;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Insufficient balance or invalid sender wallet';
        END IF;

        -- Add to receiver
        UPDATE fintech_wallets
        SET balance = balance + transfer_amount
        WHERE id = receiver_wallet_id;

        -- We would also log to fintech_ledger here in a real implementation
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("B2B transfer function created.");

    await client.query('COMMIT');
    console.log("CSM Schema Migration committed successfully.");

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
