# Troubleshooting Database Errors

## Error: "database error trying to create new user"

This error typically occurs when:
1. The `profiles` table doesn't exist
2. Row Level Security (RLS) policies are blocking profile creation
3. The database trigger isn't working

## Quick Fix Steps

### Step 1: Check if profiles table exists

Go to Supabase Dashboard → Table Editor → Check if `profiles` table exists

### Step 2: Run the migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run `001_create_profiles_table.sql` (creates table and trigger)
3. Run `003_fix_profile_insert_policy.sql` (adds INSERT policy)

### Step 3: Verify the trigger exists

Run this in SQL Editor:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If it returns nothing, the trigger doesn't exist. Re-run migration 001.

### Step 4: Test profile creation manually

Try creating a profile manually to test:
```sql
-- Replace with a real user ID from auth.users
INSERT INTO profiles (id, email, role)
VALUES ('user-id-here', 'test@example.com', 'user');
```

If this fails, check RLS policies.

## Common Error Messages

### "relation profiles does not exist"
**Solution**: Run migration `001_create_profiles_table.sql`

### "new row violates row-level security policy"
**Solution**: Run migration `003_fix_profile_insert_policy.sql` to add INSERT policy

### "duplicate key value violates unique constraint"
**Solution**: This is fine - the trigger already created the profile. The error is non-critical.

### "permission denied for table profiles"
**Solution**: Check RLS policies are set correctly. The trigger uses SECURITY DEFINER so it should work, but verify the trigger exists.

## Manual Profile Creation (If Trigger Fails)

If the trigger isn't working, you can manually create profiles:

```sql
-- For a specific user
INSERT INTO profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (id) DO NOTHING;
```

## Verify Everything is Working

1. **Check table exists:**
```sql
SELECT * FROM profiles LIMIT 1;
```

2. **Check trigger exists:**
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

3. **Check policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

You should see:
- "Users can view own profile" (SELECT)
- "Users can insert own profile" (INSERT)
- "Users can update own profile" (UPDATE)
- "Admins can view all profiles" (SELECT)
- "Admins can update all profiles" (UPDATE)

## Still Having Issues?

1. **Check Supabase Logs**: Dashboard → Logs → Postgres Logs
2. **Verify environment variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. **Test in Supabase Dashboard**: Try creating a user directly in Auth → Users
4. **Check Auth Settings**: Make sure email confirmation is configured correctly

## Alternative: Disable RLS Temporarily (For Testing Only)

⚠️ **WARNING**: Only for development/testing!

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable it:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

