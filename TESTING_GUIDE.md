# Testing Guide - Authentication & Admin System

## Quick Start Testing

### 1. Database Setup (One-time)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run Migration 1**: Copy and paste contents of `supabase/migrations/001_create_profiles_table.sql`
3. **Run Migration 2**: Copy and paste contents of `supabase/migrations/002_create_admin_user.sql`

### 2. Test User Signup

1. Navigate to `http://localhost:3000/signup`
2. Fill in email and password (min 6 characters)
3. Click "Sign Up"
4. **Expected Result**: 
   - If email confirmation is disabled: Redirects to `/dashboard`
   - If email confirmation is enabled: Shows success message, check email

### 3. Test User Login

1. Navigate to `http://localhost:3000/login`
2. Enter your email and password
3. Click "Sign In"
4. **Expected Result**: Redirects to `/dashboard` and shows your profile

### 4. Test Dashboard

1. After logging in, you should see:
   - Your email address
   - Your role (should be "user")
   - Account creation date
   - Quick action buttons
   - Recent support tickets (if any)

### 5. Create Admin Account

**Method 1: Using SQL Editor (Recommended)**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Method 2: Using Function**
```sql
SELECT promote_to_admin('your-email@example.com');
```

### 6. Test Admin Dashboard

1. **Sign out** and **sign back in** (to refresh session)
2. Navigate to `http://localhost:3000/dashboard`
3. You should see an "Admin Panel" button
4. Click it or go to `http://localhost:3000/dashboard/admin`
5. **Expected Result**: 
   - See admin badge
   - View all users with their roles
   - View all support tickets
   - See statistics (total users, admins, tickets)

### 7. Test Regular User Access

1. Create a second account (different email)
2. Try to access `/dashboard/admin`
3. **Expected Result**: Redirected back to `/dashboard` (no admin access)

## Testing Checklist

- [ ] Database migrations run successfully
- [ ] Can sign up new account
- [ ] Profile created automatically in `profiles` table
- [ ] Can sign in with credentials
- [ ] Dashboard displays user information
- [ ] Can promote user to admin via SQL
- [ ] Admin can access `/dashboard/admin`
- [ ] Admin can see all users
- [ ] Admin can see all tickets
- [ ] Regular users cannot access admin panel
- [ ] Show/hide password toggle works
- [ ] Google OAuth creates profile (if configured)

## Common Issues & Solutions

### Issue: "relation profiles does not exist"
**Solution**: Run the migration SQL in Supabase SQL Editor

### Issue: Cannot access admin panel after promoting to admin
**Solution**: 
1. Sign out completely
2. Sign back in
3. Try accessing `/dashboard/admin` again

### Issue: Profile not created on signup
**Solution**: 
1. Check Supabase logs
2. Verify trigger `on_auth_user_created` exists
3. Manually create profile:
```sql
INSERT INTO profiles (id, email, role)
VALUES ('user-id-from-auth', 'user@example.com', 'user');
```

### Issue: Email confirmation not working
**Solution**:
1. Check Supabase Auth settings
2. Verify `NEXT_PUBLIC_APP_URL` in `.env.local`
3. Check email templates in Supabase dashboard

## Environment Variables Required

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Next Steps

After testing:
1. Set up email templates in Supabase
2. Configure OAuth providers (Google, etc.) if needed
3. Customize admin panel features
4. Add more user roles if needed
5. Set up email notifications

