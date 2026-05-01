import fetch from 'node-fetch'; // if available, or use native fetch in newer node

async function testTevis() {
  const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';

  try {
    console.log("Calling Tevis Edge Function...");
    const res = await fetch(`${supabaseUrl}/functions/v1/tevis-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        message: 'Hello, testing connection.',
        history: [],
        userProfile: null
      })
    });

    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testTevis();
