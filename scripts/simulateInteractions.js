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
  "Just calibrated my flux capacitor. Anyone else seeing weird energy spikes today?",
  "The new orbital transport routes are a mess. Late to the sector meeting again.",
  "Looking for recommendations for a good cybernetics repair shop in town.",
  "Beautiful neon sunset over the skyline tonight. 🌆",
  "Has anyone tried the new synthetic coffee blend at the corner cafe? Is it any good?",
  "Warning: Solar flare activity detected. Make sure your shields are up.",
  "Selling a lightly used hoverboard. Needs a new anti-gravity coil. DM me.",
  "Can't believe the galactic council passed that new ordinance...",
  "Just uploaded my consciousness to the local mainframe for the weekend. See you all in the digital realm!",
  "Is the hyperloop down again? I've been waiting at the station for 20 minutes."
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
