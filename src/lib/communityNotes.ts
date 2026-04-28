import { supabase } from './supabase';

export const getCommunityNotes = async (postId: string) => {
  const { data, error } = await supabase
    .from('community_notes')
    .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url,
        role
      ),
      ratings:community_note_ratings (
        user_id,
        rating
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const proposeCommunityNote = async (postId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('community_notes')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      status: 'proposed'
    })
    .select()
    .single();

  return { data, error };
};

export const rateCommunityNote = async (noteId: string, userId: string, rating: 'helpful' | 'not_helpful' | 'somewhat_helpful') => {
  const { data, error } = await supabase
    .from('community_note_ratings')
    .upsert({
      note_id: noteId,
      user_id: userId,
      rating
    })
    .select()
    .single();

  return { data, error };
};
