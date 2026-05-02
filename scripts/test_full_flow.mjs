import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';
const supabase = createClient(supabaseUrl, anonKey);

async function testFull() {
  console.log("Attempting login...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'setxplatform@gmail.com',
    password: 'Dz654321!'
  });
  if (authError) {
    console.error("Login failed:", authError);
    return;
  }
  console.log("Logged in! Session token:", authData.session.access_token.substring(0, 15) + "...");
  
  console.log("Calling Tevis...");
  const { data: tevisData, error: tevisError } = await supabase.functions.invoke('tevis-ai', {
    body: {
      message: 'Hello Tevis, who are you?',
      history: [],
      userProfile: null
    }
  });

  console.log("Tevis Error:", tevisError);
  console.log("Tevis Response:", tevisData);
}
testFull();
