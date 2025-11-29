-- Fix: Add INSERT policy for profiles if it doesn't exist
-- This allows users to create their own profile during signup

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create INSERT policy for users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

