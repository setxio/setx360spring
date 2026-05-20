import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';
const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1).single();
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", Object.keys(data));
  }
}
check();
