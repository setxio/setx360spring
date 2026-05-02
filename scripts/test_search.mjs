import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const anonKey = 'sb_publishable_fGDuWjxV_uYFmzPqkq2ECg_Qn3FX0dr';
const supabase = createClient(supabaseUrl, anonKey);

async function testSearch() {
  const { data, error } = await supabase.rpc('global_search', {
    search_query: 'Keith',
    p_scope_type: 'national',
    p_scope_value: null
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
testSearch();
