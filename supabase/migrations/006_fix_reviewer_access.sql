-- Fix reviewer access: Allow public to read reviewers and ensure all fields exist
-- Run this if reviewers aren't showing in marketplace

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public can view reviewers" ON profiles;

-- Create policy to allow public/anonymous users to read reviewer profiles
CREATE POLICY "Public can view reviewers"
  ON profiles FOR SELECT
  USING (role = 'reviewer');

-- Also allow authenticated users to view reviewers (redundant but safe)
DROP POLICY IF EXISTS "Authenticated can view reviewers" ON profiles;
CREATE POLICY "Authenticated can view reviewers"
  ON profiles FOR SELECT
  TO authenticated
  USING (role = 'reviewer');

