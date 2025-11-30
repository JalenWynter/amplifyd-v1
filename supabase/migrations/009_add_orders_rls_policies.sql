-- Add Row Level Security policies for orders table
-- This ensures reviewers can see their assigned orders and artists can see their submitted orders

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Reviewers can view own orders" ON orders;
DROP POLICY IF EXISTS "Artists can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Webhook can update orders" ON orders;

-- Policy: Reviewers can view orders assigned to them
CREATE POLICY "Reviewers can view own orders"
  ON orders FOR SELECT
  USING (
    reviewer_id = auth.uid()
  );

-- Policy: Artists can view orders they created
CREATE POLICY "Artists can view own orders"
  ON orders FOR SELECT
  USING (
    artist_id = auth.uid()
  );

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can create orders (for themselves as artist)
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (
    artist_id = auth.uid() OR artist_id IS NULL
  );

-- Policy: Users can update their own orders (artists updating their orders)
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (
    artist_id = auth.uid()
  )
  WITH CHECK (
    artist_id = auth.uid()
  );

-- Note: Webhook updates typically use service role key which bypasses RLS
-- If webhooks need to update via anon key, you may need an additional policy
-- For now, webhooks should use service role key for security

