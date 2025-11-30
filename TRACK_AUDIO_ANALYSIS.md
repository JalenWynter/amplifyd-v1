# Track Audio Playback Analysis - Reviewer Reviews Page

## Problem
Track audio is not playable on the reviewer reviews page (`app/dashboard/reviewer/reviews/page.tsx`)

## Backend Flow Analysis

### 1. Data Fetching (`app/actions/orders.ts` - `getReviewerOrdersWithReviews()`)

**Lines 201-288:**
- Fetches orders with `track_url` directly from database (line 209: `*` includes `track_url`)
- **CRITICAL ISSUE**: Only signs URLs for review media (`video_url`, `audio_url`) - lines 243-276
- **MISSING**: No URL processing/signing for `track_url` field
- Returns orders with raw `track_url` from database

**What it does:**
```typescript
// ✅ Signs review video/audio URLs
if (review.video_url) {
  const filePath = extractFilePathFromUrl(review.video_url, 'reviews')
  // Creates signed URL...
}

// ❌ track_url is NOT processed - used as-is from database
```

### 2. Frontend Display (`app/dashboard/reviewer/reviews/page.tsx`)

**Lines 337-351:**
```tsx
{order.track_url && (
  <audio
    controls
    className="w-full"
    src={order.track_url}  // ← Uses raw URL from database
  >
```

**Issues:**
- Uses `order.track_url` directly without validation
- No error handling if URL is invalid
- No URL format conversion (storage path vs public URL)

### 3. Track Upload Flow (`components/hero-section.tsx`)

**Lines 88-130:**
- Uploads to `submissions` bucket
- Gets public URL: `urlData.publicUrl`
- Saves to database via `createOrder()` → `track_url: data.trackUrl`

**URL Format Saved:**
- Format: `https://[project].supabase.co/storage/v1/object/public/submissions/[path]`
- Should be a valid public URL if `submissions` bucket is public

## Root Causes

### Issue 1: No URL Validation/Processing
- `getReviewerOrdersWithReviews()` doesn't process `track_url`
- If URL format is wrong (e.g., storage path instead of public URL), audio won't play
- No fallback or error handling

### Issue 2: Submissions Bucket Configuration
- If `submissions` bucket is NOT public, public URLs won't work
- Need signed URLs instead
- Current code assumes bucket is public

### Issue 3: URL Format Mismatch
- If track was uploaded with old format (storage path), URL might be: `submissions/userId/file.mp3`
- Browser can't play this - needs full public URL or signed URL

### Issue 4: CORS Issues
- Supabase storage might have CORS restrictions
- Audio element might be blocked from loading

## Files Involved

1. **`app/dashboard/reviewer/reviews/page.tsx`** (Lines 337-351)
   - Displays audio player with `order.track_url`
   - No URL processing

2. **`app/actions/orders.ts`** (Lines 201-288)
   - `getReviewerOrdersWithReviews()` function
   - Fetches `track_url` but doesn't process it
   - Only processes review media URLs

3. **`components/hero-section.tsx`** (Lines 88-130)
   - Uploads track and saves URL to database
   - Uses `getPublicUrl()` which requires public bucket

4. **`app/actions/orders.ts`** (Lines 46-79)
   - `createOrder()` saves `track_url` to database
   - Saves whatever URL is passed (no validation)

## Expected vs Actual Behavior

**Expected:**
- Track URL is a valid public URL: `https://[project].supabase.co/storage/v1/object/public/submissions/[path]`
- Audio element can load and play the file
- Works across all browsers

**Actual:**
- Track URL might be in wrong format
- Audio element fails to load
- No error feedback to user

## Solution Requirements

1. **Process track_url in `getReviewerOrdersWithReviews()`**
   - Extract file path from URL
   - Generate signed URL if bucket is private
   - Or validate public URL format

2. **Add error handling in frontend**
   - Show error if audio fails to load
   - Fallback UI if track_url is invalid

3. **Verify submissions bucket configuration**
   - Ensure bucket is public OR use signed URLs
   - Check CORS settings

4. **URL format standardization**
   - Ensure all track URLs are in consistent format
   - Handle both public URLs and storage paths

