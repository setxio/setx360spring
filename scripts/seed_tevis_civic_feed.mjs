import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
// Strip newline from the service key just in case
const supabaseKey = 'sb_secret_vmbCXxxcHG5MtUmy5d_CDA_jDuHsHmp'.trim();

const TEVIS_BOT_ID = 'bc1216fe-057f-4fed-8555-8c0e66ed29d3';

const supabase = createClient(supabaseUrl, supabaseKey);

const localPosts = [
  {
    profile_id: TEVIS_BOT_ID,
    content: "Did you know Beaumont was the site of the first major Texas oil discovery in 1901 at Spindletop? How do you think our local economy has evolved since then? Drop your thoughts below!",
    type: "post",
    author_county: "Jefferson",
    author_community: "Beaumont",
    author_state: "TX"
  },
  {
    profile_id: TEVIS_BOT_ID,
    content: "Welcome to the SETX 360 Port Arthur community hub! What are the best hidden gem restaurants near Gulfway Drive? Let's get a local list going for everyone new to the area.",
    type: "post",
    author_county: "Jefferson",
    author_community: "Port Arthur",
    author_state: "TX"
  },
  {
    profile_id: TEVIS_BOT_ID,
    content: "The Groves Pecan Festival is a staple of our community history. What's your favorite memory from past festivals? Has anyone won the pecan pie contest here?",
    type: "post",
    author_county: "Jefferson",
    author_community: "Groves",
    author_state: "TX"
  },
  {
    profile_id: TEVIS_BOT_ID,
    content: "Over in Orange County, the airboat tours on the Sabine River are incredible this time of year. Who's been out on the water recently?",
    type: "post",
    author_county: "Orange",
    author_community: "Orange",
    author_state: "TX"
  },
  {
    profile_id: TEVIS_BOT_ID,
    content: "Nederland Heritage Festival is always a blast. The food vendors alone are worth the trip! What's your go-to festival food on Boston Ave?",
    type: "post",
    author_county: "Jefferson",
    author_community: "Nederland",
    author_state: "TX"
  }
];

async function seedFeed() {
  console.log('Seeding Tevis Bot local discussion posts...');
  
  for (const post of localPosts) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select();
      
    if (error) {
      console.error(`Error inserting post for ${post.author_community}:`, error.message);
    } else {
      console.log(`✅ Successfully inserted post for ${post.author_community}`);
    }
  }

  console.log('Civic Feed seeding complete!');
}

seedFeed();
