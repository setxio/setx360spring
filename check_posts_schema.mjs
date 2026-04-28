import { supabase } from './src/lib/supabase.ts';

async function run() {
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Post keys:", Object.keys(data[0] || {}));
  }
}

run();
