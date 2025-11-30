# Quick Fix: Marketplace Not Showing Reviewers

## Problem
Reviewers exist in Supabase but don't show on marketplace page.

## Solution (1-liners)

1. **Run migration 006**: Copy `supabase/migrations/006_fix_reviewer_access.sql` → Supabase SQL Editor → Run
2. **Check browser console**: Open DevTools → Console → Look for "Found X reviewers" log
3. **Verify RLS policy**: In Supabase → Authentication → Policies → Check "Public can view reviewers" exists
4. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to clear cache
5. **Check server logs**: Terminal running `npm run dev` should show "Found X reviewers"

## If Still Not Working

**Test query directly in Supabase SQL Editor:**
```sql
SELECT id, full_name, role, pricing_packages 
FROM profiles 
WHERE role = 'reviewer';
```

**If this returns rows but marketplace doesn't show them:**
- RLS policy issue → Run migration 006 again
- Check browser console for errors
- Verify `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**If query returns no rows:**
- Run seed script again: `npm run seed`
- Check seed script output for errors

