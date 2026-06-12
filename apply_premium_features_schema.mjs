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

    await client.query('BEGIN');

    // 1. Media Tracks (Immersive Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255),
        audio_url TEXT NOT NULL,
        album_art_url TEXT,
        plays INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Created media_tracks.");

    // 2. Jobs & Swipes
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        salary_range VARCHAR(100),
        job_type VARCHAR(50) DEFAULT 'Full-time',
        logo_url TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS job_swipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
        action VARCHAR(20) CHECK (action IN ('applied', 'passed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(candidate_id, job_id)
      );
    `);
    console.log("Created jobs tables.");

    // 3. SOS Alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        lat NUMERIC(10, 8),
        lng NUMERIC(11, 8),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Created sos_alerts.");

    // 4. Supabase Storage Buckets (Direct SQL injection to storage.buckets)
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('creator-assets', 'creator-assets', true) 
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('chat_attachments', 'chat_attachments', true) 
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Created storage buckets.");

    await client.query('COMMIT');
    console.log("Premium Features Schema Migration committed successfully.");

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
