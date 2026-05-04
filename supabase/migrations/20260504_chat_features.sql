-- Add privacy settings for chat features to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enable_online_status BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enable_typing_indicators BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enable_read_receipts BOOLEAN DEFAULT true;

-- Add read_at column to messages for read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add index for unread messages lookup
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
