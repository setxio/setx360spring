import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';
const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'setxplatform@gmail.com',
    password: 'Dz654321!'
  });
  console.log("Error:", error);
  console.log("Session:", data.session ? "Success" : "None");
}
testLogin();
