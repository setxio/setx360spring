import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';
const supabase = createClient(supabaseUrl, anonKey);

async function testDb() {
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
testDb();
