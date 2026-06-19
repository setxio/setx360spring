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
    const res = await client.query('SELECT title, album_art_url, album_id FROM media_tracks ORDER BY created_at DESC LIMIT 5');
    console.log("Recent tracks:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
