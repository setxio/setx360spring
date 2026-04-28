import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okulcpbrikcumiomrzuh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRows() {
  const { data, count, error } = await supabase
    .from('zip_to_city_location_mapping')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching count:', error);
  } else {
    console.log(`Current row count: ${count}`);
  }
}

checkRows();
