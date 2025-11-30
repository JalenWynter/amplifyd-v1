# Gemini Pro 3 Prompt: File Upload System Analysis & Fix

## Context
You are analyzing a Next.js 14+ application using Supabase for storage and database. The application has file upload functionality for:
- Avatar images (reviewer profiles)
- Audio tracks (submissions)
- Review media (video/audio files)

## Problem Statement
File uploads from users are not saving properly to database storage, and uploaded files are not playable/accessible across the site. Files may upload to storage but:
1. URLs are not being saved to the database
2. Files are not accessible via public URLs
3. Media players cannot load the files
4. Signed URLs are not being generated correctly

## Files to Analyze

### Primary Files:
1. `@app/dashboard/reviewer/settings/page.tsx` - Avatar upload handler (lines 343-427)
2. `@components/track-upload.tsx` - Track upload component
3. `@components/hero-section.tsx` - Hero section file upload
4. `@app/reviews/[orderId]/submit/page.tsx` - Review media upload (lines 156-248)
5. `@app/actions/profile.ts` - Profile update server action
6. `@app/actions/storage.ts` - Storage helper functions

### Storage Buckets Expected:
- `avatars` - For profile pictures
- `submissions` - For track uploads
- `reviews` - For review media files
- `public` - Fallback bucket

## Analysis Tasks

### Task 1: Storage Upload Flow Analysis
Analyze each upload handler and identify:
- [ ] Is the file actually being uploaded to Supabase Storage?
- [ ] Is the bucket name correct and does it exist?
- [ ] Are file paths being generated correctly?
- [ ] Is the `upsert` flag appropriate for each use case?
- [ ] Are content types being set correctly?
- [ ] Is error handling catching bucket-not-found errors?

### Task 2: URL Generation & Persistence
Check if URLs are being:
- [ ] Generated correctly after upload (`getPublicUrl` vs `createSignedUrl`)
- [ ] Saved to the database immediately after upload
- [ ] Stored in the correct database fields (avatar_url, track_url, video_url, audio_url)
- [ ] Persisted when the form is saved

**Critical Issue to Check:**
In `handleAvatarUpload` (reviewer settings), the URL is set in local state but may not be saved to database until "Save All Changes" is clicked. Verify if this is the intended flow or if it should auto-save.

### Task 3: Database Update Integration
Verify:
- [ ] Does `updateReviewerProfile` in `@app/actions/profile.ts` properly save `avatar_url`?
- [ ] Are upload handlers calling the profile update action after successful upload?
- [ ] Is the URL format compatible with what the database expects?
- [ ] Are signed URLs being used where needed (for private files)?

### Task 4: Cross-Site Accessibility
Check if uploaded files are:
- [ ] Accessible via public URLs (for public buckets)
- [ ] Using signed URLs with proper expiration (for private files)
- [ ] Being regenerated when expired (for review media)
- [ ] Loadable in `<audio>`, `<video>`, and `<img>` tags

**Key Files to Check:**
- Review card components that display media
- Marketplace pages that show reviewer avatars
- Order review pages that play audio/video

### Task 5: Storage Bucket Configuration
Verify Supabase Storage setup:
- [ ] Are buckets configured with correct RLS policies?
- [ ] Are buckets set to public or private?
- [ ] Do upload policies allow authenticated users to upload?
- [ ] Do read policies allow public/anonymous access where needed?

## Specific Issues to Fix

### Issue 1: Avatar Upload Not Persisting
**Location:** `@app/dashboard/reviewer/settings/page.tsx:343-427`

**Problem:** Avatar upload sets URL in local state but may not save to database.

**Fix Required:**
- Option A: Auto-save avatar URL immediately after upload by calling `updateReviewerProfile`
- Option B: Ensure URL is included when user clicks "Save All Changes"
- Verify the URL format matches what's expected in the database

### Issue 2: File Path Inconsistencies
**Problem:** Different upload handlers use different path formats:
- `avatars/${userId}/${timestamp}.${ext}` 
- `public/${timestamp}-${filename}`
- `reviews/${userId}/${timestamp}.${ext}`

**Fix Required:**
- Standardize path format across all upload handlers
- Ensure paths are URL-safe
- Verify paths work with both public and signed URLs

### Issue 3: Signed URL Expiration
**Problem:** Review media uses signed URLs that expire, breaking playback.

**Fix Required:**
- Implement signed URL regeneration on page load
- Use `createSignedUrl` with appropriate expiration (3600 seconds = 1 hour)
- Cache signed URLs in component state
- Regenerate when URLs are about to expire

### Issue 4: Bucket Fallback Logic
**Problem:** Multiple upload handlers have fallback logic that may not work correctly.

**Fix Required:**
- Verify fallback bucket exists and has correct permissions
- Ensure error messages are clear when buckets don't exist
- Consider creating a unified upload helper function

## Expected Behavior After Fix

1. **Avatar Upload:**
   - User selects image → Uploads to `avatars` bucket → Gets public URL → Saves to `profiles.avatar_url` → Displays immediately → Persists after "Save All Changes"

2. **Track Upload:**
   - User uploads audio → Uploads to `submissions` bucket → Gets public URL → Saves to order → Playable in audio players across site

3. **Review Media:**
   - Reviewer uploads video/audio → Uploads to `reviews` bucket → Gets signed URL → Saves to review → Playable with auto-refresh on expiration

## Code Patterns to Follow

### Correct Upload Pattern:
```typescript
// 1. Upload file
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('bucket-name')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false, // or true for avatars
    contentType: file.type,
  })

if (uploadError) throw uploadError

// 2. Get URL (public or signed)
const { data: urlData } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(filePath) // For public files
  // OR
  .createSignedUrl(filePath, 3600) // For private files

// 3. Save URL to database IMMEDIATELY
await updateProfile({ avatar_url: urlData.publicUrl })
// OR update local state if saving on form submit
```

## Deliverables

1. **Analysis Report:**
   - List all upload handlers and their current behavior
   - Identify which handlers are broken and why
   - Document storage bucket configuration requirements

2. **Fixed Code:**
   - Update all upload handlers to properly save URLs
   - Create unified upload helper if beneficial
   - Fix signed URL regeneration for review media
   - Ensure database updates happen correctly

3. **Testing Checklist:**
   - [ ] Avatar upload saves and displays immediately
   - [ ] Track uploads are playable in audio players
   - [ ] Review media plays correctly with signed URLs
   - [ ] Files persist after page refresh
   - [ ] URLs work across different pages/components

## Priority Fixes

1. **HIGH:** Avatar upload not saving to database
2. **HIGH:** Review media signed URLs expiring
3. **MEDIUM:** Standardize upload path formats
4. **MEDIUM:** Create unified upload helper
5. **LOW:** Improve error messages for missing buckets

---

**Start Analysis:** Begin by reading `@app/dashboard/reviewer/settings/page.tsx` and trace the avatar upload flow from file selection to database persistence.

