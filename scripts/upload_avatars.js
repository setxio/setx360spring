import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAvatar(profileId, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = `${profileId}-${Date.now()}.png`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, fileContent, { contentType: 'image/png' });

  if (uploadError) {
    console.error(`Upload error for ${profileId}:`, uploadError);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', profileId);

  if (updateError) {
    console.error(`Update error for ${profileId}:`, updateError);
  } else {
    console.log(`Updated avatar for ${profileId}: ${publicUrl}`);
  }
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const id = args[i];
  const path = args[i + 1];
  if (id && path) {
    await uploadAvatar(id, path);
  }
}
