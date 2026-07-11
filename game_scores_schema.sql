CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_name varchar NOT NULL,
  score bigint NOT NULL DEFAULT 0,
  round int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_scores_game_name_score_idx ON game_scores(game_name, score DESC);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own scores"
  ON game_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read scores"
  ON game_scores FOR SELECT
  TO public
  USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
