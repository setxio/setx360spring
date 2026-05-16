import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fssnybkobrfnmtohavpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ygznGqWWE11h18KsAjOQCA_cUJwT1Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPost() {
  // 1. Sign up a test user to get an auth session
  const email = `testuser123_bob100@gmail.com`;
  const password = 'testpassword123';
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
    // options
      data: { name: 'Test User', role: 'resident' }
    }
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user ID after signInWithPassword');
    return;
  }

  console.log('Signed up as:', userId);

  // Give triggers time to run
  await new Promise(r => setTimeout(r, 1000));

  // 2. Try to insert a post
  const {data: sess} = await supabase.auth.getSession(); console.log('Session user:', sess?.session?.user?.id); const {data: prof} = await supabase.from('profiles').select('*').eq('id', userId); console.log('Profile:', prof); console.log('Attempting to insert a post...');
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
