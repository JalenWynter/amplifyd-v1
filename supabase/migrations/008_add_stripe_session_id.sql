-- Add stripe_session_id column to orders table for payment verification
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Add comment
COMMENT ON COLUMN orders.stripe_session_id IS 'Stripe checkout session ID for payment verification';

