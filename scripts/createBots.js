import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We MUST use the service role key to bypass auth/captcha for automated account creation
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  console.log("Please add your SUPABASE_SERVICE_ROLE_KEY to your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const CITIES = ['Beaumont', 'Port Arthur', 'Nederland', 'Groves', 'Port Neches'];
const SCI_FI_NAMES = [
  'Astra Nova', 'Zerg Weilder', 'Orion Pax', 'Lyra Vance', 'Kaelen Zephyr',
  'Nova Star', 'Cypher Null', 'Lexa Prime', 'Jaxen Void', 'Sariel Flux',
  'Riven Kael', 'Vesper Synth', 'Cora Nebula', 'Zenith Flare', 'Jace Quantum',
  'Elara Quasar', 'Ryder Ion', 'Tara Matrix', 'Rex Pulsar', 'Mira Eclipse',
  'Dax Horizon', 'Zara Orbit', 'Kip Zenith', 'Luna Comet', 'Zane Meteor'
];

// Shuffle names so cities get random ones
const shuffledNames = [...SCI_FI_NAMES].sort(() => Math.random() - 0.5);

async function createBots() {
  console.log('Starting bot creation process...');
  let nameIndex = 0;

  for (const city of CITIES) {
    console.log(`\nCreating bots for ${city}...`);
    const formattedCity = city.toLowerCase().replace(/\s+/g, '');

    for (let i = 1; i <= 5; i++) {
      const email = `setxplatform+${formattedCity}${i}@gmail.com`;
      const password = 'Dz654321!';
      const botName = shuffledNames[nameIndex % shuffledNames.length];
      nameIndex++;

      try {
        // 1. Create Auth User
        console.log(`  Registering ${email} as ${botName}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: botName,
            community: city,
            county: 'Jefferson County',
            state: 'Texas',
            country: 'USA',
            birth_year: 2000,
            birth_month: 1,
            birth_day: 1
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`    -> User already exists, skipping creation.`);
            
            // Try to find the user to update their profile anyway
            const { data: profiles } = await supabase.from('profiles').select('id').eq('email', email);
            if (profiles && profiles.length > 0) {
                const userId = profiles[0].id;
                await updateProfile(userId, botName, city);
            }
          } else {
            console.error(`    -> Failed to create auth user: ${authError.message}`);
          }
          continue;
        }

        if (authData.user) {
          const userId = authData.user.id;
          console.log(`    -> Created auth user: ${userId}`);
          
          // Small delay to allow the database trigger (on_auth_user_created) to fire and create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await updateProfile(userId, botName, city);
        }

      } catch (err) {
        console.error(`  -> Unexpected error creating ${email}:`, err);
      }
    }
  }
  
  console.log('\nBot creation process complete!');
}

async function updateProfile(userId, name, city) {
    // 2. Ensure Profile is updated correctly (trigger might have missed some metadata if timing was off)
    const { error: profileError } = await supabase
    .from('profiles')
    .update({
      name: name,
      community: city,
      county: 'Jefferson County',
      role: 'resident',
      is_public: true
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`    -> Failed to update profile: ${profileError.message}`);
  } else {
    console.log(`    -> Profile updated successfully.`);
  }
}

createBots();
