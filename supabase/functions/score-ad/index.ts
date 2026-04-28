// Supabase Edge Function: score-ad
// Grades submitted ads on quality 1-10 and maps them to an ai_category target

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const AI_CATEGORIES = ['buying_intent', 'selling', 'job_posting', 'event_sharing', 'community_news', 'social', 'question'];

function heuristicScore(title: string, content: string): { score: number; notes: string; target_category: string } {
  const text = (title + ' ' + content).toLowerCase();
  let score = 5;
  const notes: string[] = [];
  
  if (title.length > 10) { score += 1; } else { notes.push('Add a more descriptive title'); }
  if (content.length > 50) { score += 1; } else { notes.push('Expand your ad description'); }
  if (text.match(/\$|price|cost|free|discount|sale/)) { score += 1; notes.push('Pricing info boosts engagement'); }
  if (text.match(/call|contact|visit|click|book|order|schedule/)) { score += 1; notes.push('Strong call-to-action detected'); }
  if (text.match(/local|community|[a-z]+ tx|groves|beaumont|port arthur/)) { score += 1; notes.push('Local relevance detected'); }
  
  let target_category = 'social';
  if (text.match(/job|hiring|career|work|employment/)) target_category = 'job_posting';
  else if (text.match(/event|party|gathering|festival|tonight|weekend/)) target_category = 'event_sharing';
  else if (text.match(/sale|selling|available|in stock|buy now/)) target_category = 'selling';
  else if (text.match(/service|repair|install|clean|help|assist/)) target_category = 'buying_intent';
  
  return { score: Math.min(score, 10), notes: notes.join('. ') || 'Good ad quality', target_category };
}

async function geminiScore(title: string, content: string): Promise<{ score: number; notes: string; target_category: string }> {
  const prompt = `You are an ad quality reviewer for a local community platform. Score this ad 1-10 and classify it.

Ad Title: "${title}"
Ad Content: "${content}"

Scoring criteria:
- Clarity of message (0-3 pts)
- Local relevance (0-2 pts)  
- Call to action strength (0-2 pts)
- Value proposition (0-2 pts)
- Professionalism (0-1 pt)

Target category (pick ONE): ${AI_CATEGORIES.join(', ')}

Return ONLY valid JSON:
{"score": <1-10>, "notes": "<one sentence improvement tip>", "target_category": "<category>"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const parsed = JSON.parse(text);
  const score = Math.max(1, Math.min(10, Number(parsed.score)));
  const target = AI_CATEGORIES.includes(parsed.target_category) ? parsed.target_category : 'social';
  return { score, notes: parsed.notes || '', target_category: target };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });

  try {
    const { adId, title, content } = await req.json();
    if (!adId || !title) return new Response(JSON.stringify({ error: 'adId and title required' }), { status: 400 });

    let result;
    if (GEMINI_API_KEY) {
      try { result = await geminiScore(title, content || ''); }
      catch { result = heuristicScore(title, content || ''); }
    } else {
      result = heuristicScore(title, content || '');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await supabase.from('ads').update({
      quality_score: result.score,
      quality_notes: result.notes,
      target_category: result.target_category,
    }).eq('id', adId);

    return new Response(JSON.stringify({ success: true, adId, ...result }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
