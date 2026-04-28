-- Fix: Allow all users (authenticated and anonymous) to read all stores
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on stores if not already enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 2. Drop any restrictive read policies that block non-owners
DROP POLICY IF EXISTS "stores_owner_read" ON stores;
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON stores;
DROP POLICY IF EXISTS "stores_select" ON stores;

-- 3. Create a permissive PUBLIC READ policy
CREATE POLICY "stores_public_read" 
ON stores FOR SELECT 
USING (true);   -- anyone can read any store row

-- 4. Owners can still insert/update/delete their own stores
DROP POLICY IF EXISTS "stores_owner_write" ON stores;
CREATE POLICY "stores_owner_insert"
ON stores FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_owner_update"
ON stores FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "stores_owner_delete"
ON stores FOR DELETE
USING (auth.uid() = owner_id);
