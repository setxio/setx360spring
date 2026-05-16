import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fssnybkobrfnmtohavpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ygznGqWWE11h18KsAjOQCA_cUJwT1Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPost() {
  const email = 'testuser123_bob99@gmail.com';
  const password = 'testpassword123';
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user ID after login');
    return;
  }

  console.log('Logged in as:', userId);

  const {data: sess} = await supabase.auth.getSession(); 
  console.log('Session user:', sess?.session?.user?.id); 
  
  const {data: prof} = await supabase.from('profiles').select('*').eq('id', userId); 
  console.log('Profile:', prof); 
  
  console.log('Attempting to insert a post...');
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert([
      { 
        profile_id: userId,
        content: 'This is a test post',
        type: 'post'
      }
    ]);

  if (postError) {
    console.error('Post insert error:', postError);
  } else {
    console.log('Post inserted successfully:', postData);
  }
}

testPost();
