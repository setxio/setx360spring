import { createClient } from '@supabase/supabase-js';

// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in environment
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Interfaces ---

export interface TSHAProfilePayload {
  slug: string;
  name: string;
  birth_date?: string; // YYYY-MM-DD
  death_date?: string; // YYYY-MM-DD
  bio_summary: string;
  era?: string;
  external_links?: string[];
  metadata?: Record<string, any>;
}

export interface TSHAEventPayload {
  slug: string;
  title: string;
  event_date?: string; // YYYY-MM-DD
  description: string;
  location_coords?: string; // e.g., "30.0802,-93.9802"
  impact_rating?: number; // 1-100
}

export interface CensusStatPayload {
  county: string;
  year: number;
  data_type: 'demographic' | 'economic' | 'infrastructure';
  metrics: Record<string, any>;
  source_url?: string;
}

// --- Utilities ---

/**
 * Utility to generate an embedding using a local huggingface pipeline or calling Supabase Edge Function
 * For this stub, we'll assume there's an API route or we use the supabase DB directly to compute it if we had pg_vector embeddings trigger,
 * but let's mock the embedding generation for the pipeline.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // In a real Node script, you might use an OpenAI API key or a local ONNX runtime.
  // For the stub, we just return an empty array (or you can call your own edge function).
  console.log(`[Stub] Generating embedding for text: ${text.substring(0, 50)}...`);
  return new Array(384).fill(0.01); 
}

// --- Ingestion Functions ---

export async function ingestTSHAProfile(payload: TSHAProfilePayload) {
  try {
    const textToEmbed = `${payload.name}. ${payload.bio_summary}`;
    const embedding = await generateEmbedding(textToEmbed);

    const { data, error } = await supabase.from('wiki_profiles').upsert({
      slug: payload.slug,
      name: payload.name,
      birth_date: payload.birth_date,
      death_date: payload.death_date,
      bio_summary: payload.bio_summary,
      era: payload.era,
      external_links: payload.external_links,
      metadata: payload.metadata,
      embedding: embedding
    }, { onConflict: 'slug' }).select();

    if (error) throw error;
    console.log(`Successfully ingested profile: ${payload.name}`);
    return data;
  } catch (error) {
    console.error(`Failed to ingest profile ${payload.name}:`, error);
    throw error;
  }
}

export async function ingestTSHAEvent(payload: TSHAEventPayload) {
  try {
    const textToEmbed = `${payload.title}. ${payload.description}`;
    const embedding = await generateEmbedding(textToEmbed);

    const { data, error } = await supabase.from('wiki_events').upsert({
      slug: payload.slug,
      title: payload.title,
      event_date: payload.event_date,
      description: payload.description,
      location_coords: payload.location_coords,
      impact_rating: payload.impact_rating,
      embedding: embedding
    }, { onConflict: 'slug' }).select();

    if (error) throw error;
    console.log(`Successfully ingested event: ${payload.title}`);
    return data;
  } catch (error) {
    console.error(`Failed to ingest event ${payload.title}:`, error);
    throw error;
  }
}

export async function ingestCensusStats(payload: CensusStatPayload) {
  try {
    const { data, error } = await supabase.from('wiki_statistics').insert({
      county: payload.county,
      year: payload.year,
      data_type: payload.data_type,
      metrics: payload.metrics,
      source_url: payload.source_url
    }).select();

    if (error) throw error;
    console.log(`Successfully ingested stat for ${payload.county} (${payload.year})`);
    return data;
  } catch (error) {
    console.error(`Failed to ingest stat:`, error);
    throw error;
  }
}

// Example usage if executed directly
if (require.main === module) {
  console.log('Running Ingestion Stub for SETX Figures...');
  
  // Sports Figures
  ingestTSHAProfile({
    slug: 'babe-didrikson-zaharias',
    name: 'Babe Didrikson Zaharias',
    birth_date: '1911-06-26',
    death_date: '1956-09-27',
    bio_summary: 'Born in Port Arthur, Texas. Widely considered one of the greatest female athletes of all time, excelling in golf, basketball, baseball and track and field.',
    era: '1930s-1950s',
    metadata: { profession: 'athlete', sports: ['golf', 'track and field', 'basketball'] }
  });

  ingestTSHAProfile({
    slug: 'jamaal-charles',
    name: 'Jamaal Charles',
    birth_date: '1986-12-27',
    bio_summary: 'Born in Port Arthur, Texas. Former American football running back who played in the NFL, primarily for the Kansas City Chiefs. Known for his elite speed and yards-per-carry average.',
    era: '2000s-2010s',
    metadata: { profession: 'athlete', sports: ['football'] }
  });

  ingestTSHAProfile({
    slug: 'jimmy-johnson',
    name: 'Jimmy Johnson',
    birth_date: '1943-07-16',
    bio_summary: 'Born in Port Arthur, Texas. Hall of Fame football coach and sports analyst. Led the Dallas Cowboys to two consecutive Super Bowl victories.',
    era: '1980s-1990s',
    metadata: { profession: 'coach', sports: ['football'] }
  });

  // Music Artists
  ingestTSHAProfile({
    slug: 'janis-joplin',
    name: 'Janis Joplin',
    birth_date: '1943-01-19',
    death_date: '1970-10-04',
    bio_summary: 'Born in Port Arthur, Texas. One of the most successful and widely known rock stars of her era, noted for her powerful mezzo-soprano vocals and "electric" stage presence.',
    era: '1960s',
    metadata: { profession: 'musician', genres: ['rock', 'soul', 'blues'] }
  });

  ingestTSHAProfile({
    slug: 'george-jones',
    name: 'George Jones',
    birth_date: '1931-09-12',
    death_date: '2013-04-26',
    bio_summary: 'Born in Saratoga, Texas (Hardin County) and raised in Vidor. Internationally famous American country music singer known for his long list of hit records and distinctive voice.',
    era: '1950s-2000s',
    metadata: { profession: 'musician', genres: ['country'] }
  });

  ingestTSHAProfile({
    slug: 'the-big-bopper',
    name: 'J. P. "The Big Bopper" Richardson',
    birth_date: '1930-10-24',
    death_date: '1959-02-03',
    bio_summary: 'Born in Sabine Pass, Texas. Musician, songwriter, and DJ whose rockabilly look, style, voice, and exuberant personality made him an early rock and roll star. Famous for "Chantilly Lace".',
    era: '1950s',
    metadata: { profession: 'musician', genres: ['rock and roll', 'rockabilly'] }
  });

  ingestTSHAProfile({
    slug: 'tracy-byrd',
    name: 'Tracy Byrd',
    birth_date: '1966-12-17',
    bio_summary: 'Born in Vidor, Texas. Country music artist who has charted more than thirty hit singles in his career, including "Holdin\' Heaven" and "Watermelon Crawl".',
    era: '1990s-2000s',
    metadata: { profession: 'musician', genres: ['country'] }
  });
}
