import { supabase } from './supabase';

/**
 * SETXIO3 Batch Import Logic
 * Handles massive regional data ingestion (Counties, Businesses, Official Data)
 */

export async function importBusinessBatch(batchData: any[], county: string) {
  console.log(`Starting import for ${county} (${batchData.length} records)`);
  
  // Map SETXIO3 JSON schema to SETX360 DB schema
  const stores = batchData.map(item => ({
    name: item.name,
    address: item.address,
    location: `${item.city}, TX`,
    zip: item.zip,
    county: item.county || county,
    category: item.category?.toLowerCase() || 'retail',
    subcategory: item.subcategory,
    is_verified: false,
    image_url: null,
    owner_id: null // Unclaimed stores
  }));

  // Batch insert into Supabase
  // We do chunks of 100 to avoid request size limits
  const CHUNK_SIZE = 100;
  let totalImported = 0;

  for (let i = 0; i < stores.length; i += CHUNK_SIZE) {
    const chunk = stores.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('stores').insert(chunk);
    
    if (error) {
      console.error(`Chunk ${i / CHUNK_SIZE} failed:`, error);
      throw error;
    }
    totalImported += chunk.length;
  }

  return totalImported;
}

export async function fetchLocalWeather(_zip: string) {
  // Logic for dynamic weather (Placeholder for real API call)
  // In a real app, use OpenWeatherMap or similar
  return {
    temp: 76,
    condition: 'Mostly Sunny',
    humidity: 45,
    wind: 12,
    high: 82,
    low: 68
  };
}

export async function fetchLocalSports() {
  // Logic to fetch sports events from the new 'posts' with type 'event' and category 'sports'
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .eq('type', 'event')
    .eq('ai_category', 'sports')
    .order('created_at', { ascending: false });
  
  return data || [];
}
