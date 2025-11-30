# Seed Script Guide

## Quick Start (1-liners)

1. **Add service role key to .env.local**: Get from Supabase Dashboard → Settings → API → `service_role` key (secret)
2. **Install dependencies**: `npm install`
3. **Run seed script**: `npm run seed`
4. **Verify in Supabase**: Check `profiles` table for reviewers with `role = 'reviewer'`

## What It Does

- Creates 6 test reviewer accounts with auth users
- Adds complete profile data (name, bio, tags, ratings)
- Includes pricing packages JSON for each reviewer
- Uses service role key to bypass RLS policies
- Idempotent: safe to run multiple times (upserts data)

## Environment Variables Required

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**⚠️ Security Note**: Service role key bypasses RLS - never commit to git or expose publicly!

## Database Schema Requirements

The script expects these columns in `profiles` table:
- `id` (UUID, primary key)
- `email` (TEXT)
- `role` (TEXT) - must support 'reviewer' value
- `full_name` (TEXT)
- `bio` (TEXT)
- `tags` (JSONB or TEXT[])
- `verified` (BOOLEAN)
- `rating` (NUMERIC)
- `review_count` (INTEGER)
- `pricing_packages` (JSONB)
- `avatar_url` (TEXT)

## Test Accounts Created

All passwords: `TestPassword123!`

1. **Nova Quinn** - nova.quinn@amplifyd.test (Trap, Mixing, Vocals)
2. **Atlas Reed** - atlas.reed@amplifyd.test (House, Sound Design, Mastering)
3. **Mara Sol** - mara.sol@amplifyd.test (Indie, Songwriting, Production)
4. **Kairo Vega** - kairo.vega@amplifyd.test (EDM, Mastering, Sound Design)
5. **Ivy Monroe** - ivy.monroe@amplifyd.test (Pop, Songwriting, Vocal Production)
6. **Sage O'Connor** - sage.oconnor@amplifyd.test (Ambient, Mixing, Mastering)

## Troubleshooting

**Error: "Missing SUPABASE_SERVICE_ROLE_KEY"**
- Add the service role key to `.env.local` (not `.env`)

**Error: "role must be 'user' or 'admin'"**
- Update your profiles table schema to allow 'reviewer' role:
  ```sql
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'reviewer'));
  ```

**Error: "column does not exist"**
- Run migration to add missing columns to profiles table
- Or manually add columns via Supabase Dashboard → Table Editor

**Users created but profiles not updated**
- Check RLS policies allow service role updates
- Verify service role key is correct

