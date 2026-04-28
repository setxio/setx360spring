import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testQuery() {
  console.log('Testing SocialFeed query...');
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_profile_id_fkey (
        id,
        community,
        county,
        state
      )
    `)
    .filter('author.community', 'eq', 'Groves')
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success, count:', data?.length);
  }
}

testQuery();
