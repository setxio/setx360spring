// Supabase Edge Function: moderate-post
// Purpose: AI content moderation using Gemini Flash
// Auto-hide: hate_speech, nsfw
// Flag for review: spam, misinformation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

type ModerationFlag = 'clean' | 'spam' | 'hate_speech' | 'nsfw' | 'misinformation';

// Auto-hide these — no human review needed
const AUTO_HIDE: ModerationFlag[] = ['hate_speech', 'nsfw'];
// These stay visible but appear in admin queue
const FLAG_FOR_REVIEW: ModerationFlag[] = ['spam', 'misinformation'];

async function moderateWithGemini(content: string): Promise<{ flag: ModerationFlag; reason: string }> {
  const prompt = `You are a content moderator for a community social platform in the United States. Classify this post content into EXACTLY ONE category:

clean - acceptable community content
spam - repetitive, promotional without value, or bot-like
hate_speech - attacks based on race, religion, gender, sexual orientation, etc.
nsfw - sexually explicit or graphic violence
misinformation - demonstrably false claims presented as fact

Post: """${content.slice(0, 600)}"""

Respond with ONLY valid JSON, no markdown:
{"flag": "<one of the 5 categories>", "reason": "<one sentence explanation>"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  try {
    const parsed = JSON.parse(text);
    const validFlags: ModerationFlag[] = ['clean', 'spam', 'hate_speech', 'nsfw', 'misinformation'];
    const flag = validFlags.includes(parsed.flag) ? parsed.flag : 'clean';
    return { flag, reason: parsed.reason || '' };
  } catch {
    return { flag: 'clean', reason: '' };
  }
}

// Simple heuristic fallback if no Gemini key
function heuristicModerate(content: string): { flag: ModerationFlag; reason: string } {
  const text = content.toLowerCase();
  const spamPatterns = /click here|buy now|make money|free money|limited offer|act now|guaranteed/;
  if (spamPatterns.test(text)) return { flag: 'spam', reason: 'Detected spam patterns' };
  return { flag: 'clean', reason: '' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { postId, content, profileId } = await req.json();
    if (!postId || !content) {
      return new Response(JSON.stringify({ error: 'postId and content required' }), { status: 400 });
    }

    // Skip very short posts — not worth moderating
    if (content.trim().length < 8) {
      return new Response(JSON.stringify({ flag: 'clean', skipped: true }));
    }

    let result: { flag: ModerationFlag; reason: string };
    if (GEMINI_API_KEY) {
      try {
        result = await moderateWithGemini(content);
      } catch (e) {
        console.warn('Gemini moderation failed, using heuristic:', e);
        result = heuristicModerate(content);
      }
    } else {
      result = heuristicModerate(content);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let moderationStatus = 'clean';
    if (AUTO_HIDE.includes(result.flag)) {
      moderationStatus = 'hidden';
    } else if (FLAG_FOR_REVIEW.includes(result.flag)) {
      moderationStatus = 'flagged';
    }

    // Update the post
    await supabase.from('posts').update({
      moderation_status: moderationStatus,
      moderation_flag: result.flag === 'clean' ? null : result.flag,
      moderation_checked_at: new Date().toISOString(),
    }).eq('id', postId);

    // If flagged/hidden — insert admin notification
    if (moderationStatus !== 'clean') {
      const { data: admin } = await supabase
        .from('profiles').select('id').eq('role', 'admin').limit(1).single();

      if (admin) {
        await supabase.from('notifications').insert({
          recipient_id: admin.id,
          type: 'moderation_flag',
          content: `Post flagged as "${result.flag}": ${content.slice(0, 80)}...`,
          reference_id: postId,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, postId, flag: result.flag, status: moderationStatus }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('moderate-post error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
