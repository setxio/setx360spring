-- ═══════════════════════════════════════════════════════════════════
-- POLL SYSTEM UPGRADE: Tracking individual votes and selection changes
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all poll votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage own poll votes" ON public.poll_votes FOR ALL USING (auth.uid() = profile_id);

-- FUNCTION: Handle Vote with Selection Changes
-- This is better handled as a RPC to ensure atomicity
CREATE OR REPLACE FUNCTION public.cast_poll_vote(p_post_id UUID, p_option_index INT)
RETURNS JSONB AS $$
DECLARE
  v_old_index INT;
  v_poll_data JSONB;
  v_options JSONB;
  v_total INT;
BEGIN
  -- 1. Get current poll data
  SELECT poll_data INTO v_poll_data FROM public.posts WHERE id = p_post_id;
  IF v_poll_data IS NULL THEN
    RAISE EXCEPTION 'Post is not a poll or has no data';
  END IF;

  -- 2. Check for existing vote
  SELECT option_index INTO v_old_index FROM public.poll_votes 
  WHERE post_id = p_post_id AND profile_id = auth.uid();

  v_options := v_poll_data->'options';
  v_total := COALESCE((v_poll_data->>'total_votes')::INT, 0);

  IF v_old_index IS NOT NULL THEN
    -- CHANGE VOTE
    IF v_old_index = p_option_index THEN
      RETURN v_poll_data; -- No change
    END IF;

    -- Decrement old
    v_options := jsonb_set(
      v_options, 
      ARRAY[v_old_index::text, 'votes'], 
      ((v_options->v_old_index->>'votes')::INT - 1)::text::jsonb
    );
    -- Increment new
    v_options := jsonb_set(
      v_options, 
      ARRAY[p_option_index::text, 'votes'], 
      ((v_options->p_option_index->>'votes')::INT + 1)::text::jsonb
    );
    
    UPDATE public.poll_votes SET option_index = p_option_index 
    WHERE post_id = p_post_id AND profile_id = auth.uid();
  ELSE
    -- NEW VOTE
    v_options := jsonb_set(
      v_options, 
      ARRAY[p_option_index::text, 'votes'], 
      ((v_options->p_option_index->>'votes')::INT + 1)::text::jsonb
    );
    v_total := v_total + 1;
    
    INSERT INTO public.poll_votes (post_id, profile_id, option_index)
    VALUES (p_post_id, auth.uid(), p_option_index);
  END IF;

  -- 3. Update Post
  v_poll_data := jsonb_set(v_poll_data, '{options}', v_options);
  v_poll_data := jsonb_set(v_poll_data, '{total_votes}', v_total::text::jsonb);

  UPDATE public.posts SET poll_data = v_poll_data WHERE id = p_post_id;

  RETURN v_poll_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
