
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSources() {
  const { data, error } = await supabase
    .from('stan_alerts')
    .select('source, count()')
    .group('source');
  
  if (error) {
    console.error(error);
    return;
  }
  console.log(data);
}

checkSources();
