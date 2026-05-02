import fetch from 'node-fetch'; // if available, or use native fetch in newer node

async function testTevis() {
  const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
  const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, anonKey);
    console.log("Calling Tevis Edge Function via Client...");
    const { data, error } = await supabase.functions.invoke('tevis-ai', {
      body: {
        message: 'Hello Tevis, who are you?',
        history: [],
        userProfile: null
      }
    });

    console.log("Error:", error);
    console.log("Response Body:", data);
}

testTevis();
