-- Migration to add Arcade Coins and Profile Badges
ALTER TABLE profiles 
ADD COLUMN arcade_badges TEXT[] DEFAULT '{}',
ADD COLUMN arcade_coins INTEGER DEFAULT 0;

-- Optional: Create a function to securely purchase badges using coins
CREATE OR REPLACE FUNCTION purchase_arcade_badge(badge_name TEXT, cost INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_coins INTEGER;
  current_badges TEXT[];
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current coins and badges
  SELECT arcade_coins, arcade_badges INTO current_coins, current_badges
  FROM profiles
  WHERE id = auth.uid();

  -- Check if they already have the badge
  IF badge_name = ANY(current_badges) THEN
    RETURN TRUE; -- Already own it
  END IF;

  -- Check if they can afford it
  IF current_coins < cost THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Deduct coins and add badge
  UPDATE profiles
  SET 
    arcade_coins = arcade_coins - cost,
    arcade_badges = array_append(arcade_badges, badge_name)
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$;
