# Database Setup Guide

This guide will help you set up the Supabase database with user profiles and admin functionality.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and anon key in your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Setup Steps

### 1. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:

#### Migration 1: Create Profiles Table
   - Copy the contents of `supabase/migrations/001_create_profiles_table.sql`
   - Paste into SQL Editor and run

#### Migration 2: Create Admin Functions
   - Copy the contents of `supabase/migrations/002_create_admin_user.sql`
   - Paste into SQL Editor and run

### 2. Create Your First Admin User

After signing up for an account:

**Option A: Using SQL Editor**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Option B: Using the Function**
```sql
SELECT promote_to_admin('your-email@example.com');
```

### 3. Verify Setup

1. Sign up for a new account at `/signup`
2. Check that a profile was created in the `profiles` table
3. Promote your account to admin using one of the methods above
4. Sign in and navigate to `/dashboard/admin` to verify admin access

## Database Schema

### `profiles` Table
- `id` (UUID, Primary Key) - References `auth.users(id)`
- `email` (TEXT) - User's email address
- `role` (TEXT) - Either 'user' or 'admin'
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last update date

### Row Level Security (RLS)
- Users can only view/update their own profile
- Admins can view/update all profiles
- Users cannot change their own role (only admins can)

## Testing

1. **Test Regular User Signup:**
   - Go to `/signup`
   - Create a new account
   - Verify you can access `/dashboard`
   - Verify you cannot access `/dashboard/admin`

2. **Test Admin Access:**
   - Promote your account to admin
   - Sign out and sign back in
   - Verify you can access `/dashboard/admin`
   - Verify you can see all users and tickets

3. **Test Email Confirmation:**
   - If email confirmation is enabled in Supabase Auth settings
   - Sign up should show a confirmation message
   - Check email and click confirmation link
   - Then sign in

## Troubleshooting

### Profile not created on signup
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is working
- Check Supabase logs for errors

### Cannot access admin panel
- Verify your profile has `role = 'admin'` in the database
- Sign out and sign back in to refresh session
- Check that RLS policies are correctly set

### Email confirmation issues
- Check Supabase Auth settings
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check that email templates are configured in Supabase

## Security Notes

- Never expose your Supabase service role key
- Always use RLS policies to protect data
- Admin functions use `SECURITY DEFINER` - use with caution
- Regularly audit admin users

## Stripe Integration

For Stripe webhook testing and setup, see [README_STRIPE.md](./README_STRIPE.md)

