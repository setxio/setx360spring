import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = 'cae1c6f0-f813-41c0-b1c4-f5bc68e1abf7';

async function testEngagement() {
  console.log('Creating a test post as a human user...');
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      profile_id: TEST_USER_ID,
      content: "I'm thinking about visiting the Spindletop Museum this weekend. Is it worth the trip?",
      type: 'post'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return;
  }

  console.log('Post created:', data.id);
  console.log('Waiting 10 seconds for bot response (40% chance)...');
  
  setTimeout(async () => {
    const { data: comments, error: commentError } = await supabase
      .from('comments')
      .select('*, author:profiles(name)')
      .eq('post_id', data.id);
      
    if (commentError) {
      console.error('Error fetching comments:', commentError);
    } else if (comments.length > 0) {
      console.log('Success! Bot responded:');
      comments.forEach(c => console.log(`[${c.author.name}]: ${c.content}`));
    } else {
      console.log('No response this time (40% probability). Try running the script again if needed.');
    }
  }, 10000);
}

testEngagement();
