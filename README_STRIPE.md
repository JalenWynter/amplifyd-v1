# Stripe Integration Guide

## Setup

### Environment Variables

Add these to your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get this from Stripe Dashboard or CLI
```

## Webhook Testing (No CLI Required)

You have several options to test webhooks without installing the Stripe CLI globally:

### Option 1: Stripe Dashboard (Easiest)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Local**: Use ngrok or similar: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`) to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Option 2: ngrok (For Local Testing)

1. Install ngrok: `brew install ngrok` or download from [ngrok.com](https://ngrok.com)
2. Start your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Add webhook endpoint in Stripe Dashboard pointing to: `https://abc123.ngrok.io/api/webhooks/stripe`
6. Copy the webhook signing secret to `.env.local`

### Option 3: Stripe CLI (If You Can Install It)

If you can update your Command Line Tools:

```bash
# Update Command Line Tools first
sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install

# Then install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will output a webhook signing secret - add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Testing the Flow

1. **Start your dev server**: `npm run dev`
2. **Set up webhook endpoint** (using one of the options above)
3. **Test checkout**:
   - Go to `/marketplace`
   - Select a reviewer and package
   - Click "Book Now"
   - Complete test payment (use card `4242 4242 4242 4242`)
4. **Verify webhook**:
   - Check your terminal/server logs for webhook processing
   - Check Supabase `orders` table - status should change from `pending` to `paid`
   - Check reviewer dashboard - order should appear in "Active Queue"

## Webhook Endpoint

The webhook endpoint is at: `/api/webhooks/stripe`

It handles:
- Signature verification
- `checkout.session.completed` events
- Updates order status to `paid` in Supabase

## Troubleshooting

### Webhook not receiving events

1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. Verify webhook endpoint URL is correct in Stripe Dashboard
3. Check server logs for errors
4. Ensure your server is accessible (if using ngrok, check it's running)

### "Missing stripe-signature header"

- This means the request isn't coming from Stripe
- Verify the webhook URL in Stripe Dashboard matches your endpoint

### "Webhook signature verification failed"

- Check `STRIPE_WEBHOOK_SECRET` matches the one from Stripe Dashboard
- Ensure you're using the correct secret (test vs live mode)

## Production Deployment

For production:

1. Deploy your app (Vercel, etc.)
2. Add webhook endpoint in Stripe Dashboard pointing to: `https://yourdomain.com/api/webhooks/stripe`
3. Use the production webhook signing secret in your production environment variables
4. Test with a real payment (use your own card in test mode first)

