import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('merchants').select('*').limit(1);
  console.log('merchants table check:', { data, error });
  
  const { data: stores, error: storesError } = await supabase.from('stores').select('*').limit(1);
  console.log('stores table check:', { stores, storesError });
}
test();
