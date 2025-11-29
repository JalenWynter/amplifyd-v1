-- This migration creates an admin user
-- Run this after creating your first user account
-- Replace 'YOUR_ADMIN_EMAIL@example.com' with the email of the user you want to make admin

-- Example: Update a specific user to admin role
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- Or create a function to promote a user to admin (for use in Supabase dashboard or via API)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins only should use this)
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated;

