-- Allow public/anonymous users to read reviewer profiles
-- This is needed for the marketplace to display reviewers

CREATE POLICY "Public can view reviewers"
  ON profiles FOR SELECT
  USING (role = 'reviewer');

