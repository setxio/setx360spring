-- Fix the cast_poll_vote RPC to handle vote switching correctly
CREATE OR REPLACE FUNCTION public.cast_poll_vote(
    p_post_id UUID,
    p_option_index INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_old_option INTEGER;
    v_post_record RECORD;
    v_new_poll_data JSONB;
    v_options JSONB;
    v_option JSONB;
    v_total_votes INTEGER;
    i INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the post for update to prevent race conditions
    SELECT * INTO v_post_record FROM public.posts WHERE id = p_post_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    IF v_post_record.type != 'poll' THEN
        RAISE EXCEPTION 'Post is not a poll';
    END IF;

    v_new_poll_data := v_post_record.poll_data;
    v_options := v_new_poll_data->'options';
    v_total_votes := (v_new_poll_data->>'total_votes')::INTEGER;

    -- Check if user has already voted
    SELECT option_index INTO v_old_option
    FROM public.poll_votes
    WHERE post_id = p_post_id AND profile_id = v_user_id;

    IF FOUND THEN
        -- If voting for the same option, just return current data
        IF v_old_option = p_option_index THEN
            RETURN v_new_poll_data;
        END IF;

        -- Switching vote: decrement old option
        v_options := jsonb_set(
            v_options,
            ARRAY[(v_old_option)::TEXT, 'votes'],
            ((v_options->v_old_option->>'votes')::INTEGER - 1)::TEXT::JSONB
        );

        -- Update the poll_votes table
        UPDATE public.poll_votes
        SET option_index = p_option_index, created_at = NOW()
        WHERE post_id = p_post_id AND profile_id = v_user_id;
    ELSE
        -- New vote: increment total_votes
        v_total_votes := v_total_votes + 1;
        
        -- Insert into poll_votes
        INSERT INTO public.poll_votes (post_id, profile_id, option_index)
        VALUES (p_post_id, v_user_id, p_option_index);
    END IF;

    -- Increment new option
    v_options := jsonb_set(
        v_options,
        ARRAY[(p_option_index)::TEXT, 'votes'],
        ((v_options->p_option_index->>'votes')::INTEGER + 1)::TEXT::JSONB
    );

    -- Update post with new data
    v_new_poll_data := v_new_poll_data || jsonb_build_object('options', v_options, 'total_votes', v_total_votes);
    
    UPDATE public.posts
    SET poll_data = v_new_poll_data
    WHERE id = p_post_id;

    RETURN v_new_poll_data;
END;
$$;
