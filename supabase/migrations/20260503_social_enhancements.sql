-- Add is_pinned column to posts table for profile pinned post feature
alter table posts add column if not exists is_pinned boolean default false;

-- Index for fast pinned post lookup per profile
create index if not exists idx_posts_is_pinned on posts(profile_id, is_pinned) where is_pinned = true;

-- Add mention notification type support (no schema change needed, type is text field)
-- Ensure getIcon in NotificationsView handles 'mention' type (handled in frontend)
