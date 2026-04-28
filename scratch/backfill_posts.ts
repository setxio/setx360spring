import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function backfillPosts() {
  console.log('Starting backfill of posts location data...');
  
  // 1. Fetch posts with null location with their author's community
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('id, profile_id, author:profiles!posts_profile_id_fkey(community)')
    .is('location', null)
    .limit(500); // Batch avoid timeouts

  if (fetchError) {
    console.error('Error fetching posts:', fetchError);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('No posts need backfilling.');
    return;
  }

  console.log(`Found ${posts.length} posts to backfill.`);

  let updatedCount = 0;
  for (const post of posts) {
    const community = post.author?.community;
    if (community) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ location: community })
        .eq('id', post.id);
      
      if (!updateError) updatedCount++;
    }
  }

  console.log(`Backfilled ${updatedCount} posts.`);
  
  if (posts.length === 500) {
    console.log('More posts may remain, please run again.');
  }
}

backfillPosts();
