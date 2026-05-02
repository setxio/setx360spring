import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROMPTS = [
  "Did anyone else see the fog rolling in off the Neches this morning? Truly beautiful.",
  "Just had the best gumbo of my life at a little spot in Port Arthur. SETX food never misses.",
  "Reminder: The school board meeting is tonight at 6 PM. Important stuff on the agenda.",
  "The humidity today is no joke. I think I just saw a mosquito the size of a sparrow.",
  "Has anyone checked out the new park downtown yet? It looks like a great spot for the kids.",
  "Warning: Traffic on I-10 is backed up near the bridge. Might want to take a detour.",
  "Looking for a reliable plumber in Beaumont. Any recommendations from the neighbors?",
  "Anyone else excited for the high school football game this Friday? Go team!",
  "Just saw a gopher crossing the road like he owned the place. Typical SETX wildlife.",
  "Thinking about starting a community garden in our neighborhood. Who's in?"
];

const COMMENT_PROMPTS = [
  "I was just thinking the same thing!",
  "Totally agree with this.",
  "Not sure I agree, but interesting perspective.",
  "Have you tried recalibrating the primary sensors?",
  "That's wild! Thanks for sharing.",
  "Stay safe out there.",
  "I heard about that on the holonet.",
  "Let me know if you find a good place for that.",
  "Incredible! 🚀",
  "This happens every solar cycle, I swear."
];

async function simulateInteractions() {
  console.log('Starting bot interaction simulation...');

  // 1. Fetch all bot profiles
  const { data: bots, error: botsError } = await supabase
    .from('profiles')
    .select('id, name, community')
    .like('email', 'setxplatform+%@gmail.com');

  if (botsError) {
    console.error("Failed to fetch bots:", botsError);
    return;
  }

  if (!bots || bots.length === 0) {
    console.log("No bot accounts found. Did you run createBots.js first?");
    return;
  }

  console.log(`Found ${bots.length} active bot accounts.`);

  // 2. Decide how many posts to create (let's do 3 random posts)
  const numPosts = 3;

  for (let i = 0; i < numPosts; i++) {
    // Pick a random author bot
    const authorBot = bots[Math.floor(Math.random() * bots.length)];
    const postContent = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

    console.log(`\n[POST] ${authorBot.name} (${authorBot.community}): ${postContent}`);

    // Insert Post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        profile_id: authorBot.id,
        content: postContent,
        type: 'post',
        location: authorBot.community
      })
      .select()
      .single();

    if (postError) {
      console.error("  -> Failed to create post:", postError);
      continue;
    }

    // 3. Generate 1-3 random comments for this post
    const numComments = Math.floor(Math.random() * 3) + 1;
    
    // Filter out the author from potential commenters to avoid self-replies
    const potentialCommenters = bots.filter(b => b.id !== authorBot.id);

    for (let j = 0; j < numComments; j++) {
      if (potentialCommenters.length === 0) break;
      
      const commenterIndex = Math.floor(Math.random() * potentialCommenters.length);
      const commenter = potentialCommenters[commenterIndex];
      // Remove to prevent double commenting
      potentialCommenters.splice(commenterIndex, 1);

      const commentContent = COMMENT_PROMPTS[Math.floor(Math.random() * COMMENT_PROMPTS.length)];

      console.log(`  [COMMENT] ${commenter.name}: ${commentContent}`);

      await supabase
        .from('comments')
        .insert({
          post_id: newPost.id,
          profile_id: commenter.id,
          content: commentContent
        });
    }
  }

  console.log('\nSimulation complete! Check the live feed to see the results.');
}

simulateInteractions();
