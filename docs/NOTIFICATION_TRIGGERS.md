# Notification System - Default Triggers & Templates

This document outlines all default notification triggers and templates used throughout the Amplifyd platform.

## Notification Types

- **`system`**: General system notifications (maintenance, updates, welcome messages)
- **`payment`**: Payment-related notifications (order paid, payment issues)
- **`review`**: Review-related notifications (review completed, review ready)
- **`order`**: Order status notifications (order created, order updated)

---

## Automatic Triggers

### 1. Payment Notifications

**Trigger**: When an order payment is confirmed via Stripe webhook
- **File**: `app/api/webhooks/stripe/route.ts`
- **Recipient**: Reviewer (the `reviewer_id` from the order)
- **Type**: `payment`
- **Title**: "New Paid Order!"
- **Message**: `"[Track Title]" is ready for review.`
- **Link**: `/dashboard/reviewer`
- **When**: `checkout.session.completed` event with `payment_status === 'paid'`

---

### 2. Review Completion Notifications

**Trigger**: When a reviewer submits a completed review
- **File**: `app/actions/reviews.ts` → `submitReview()`
- **Recipient**: Artist (the `artist_id` from the order)
- **Type**: `review`
- **Title**: "Review Ready!"
- **Message**: `Your feedback for [Track Title] is here.`
- **Link**: `/orders/[orderId]/review`
- **When**: After successful review submission and order status update to 'completed'

---

### 3. Welcome Notifications

**Trigger**: When a new user signs up (can be implemented in signup flow)
- **File**: `app/auth/actions.ts` → `signUp()` (to be implemented)
- **Recipient**: New user
- **Type**: `system`
- **Title**: "Welcome to Amplifyd!"
- **Message**: `Complete your profile to get started.`
- **Link**: `/dashboard/settings`
- **When**: After successful user registration

---

## Admin-Controlled Templates

These templates are available in the Admin Dashboard for site-wide broadcasts:

### 1. Welcome Message
- **ID**: `welcome`
- **Title**: "Welcome to Amplifyd!"
- **Message**: "Complete your profile to get started."
- **Link**: `/dashboard/settings`
- **Use Case**: Onboarding new users

### 2. Scheduled Maintenance
- **ID**: `maintenance`
- **Title**: "Scheduled Maintenance"
- **Message**: "We will be performing scheduled maintenance on [DATE] from [TIME]. The site may be temporarily unavailable."
- **Link**: `null`
- **Use Case**: Planned downtime announcements

### 3. New Feature Announcement
- **ID**: `feature`
- **Title**: "New Feature Available!"
- **Message**: "Check out our latest feature: [FEATURE_NAME]. [DESCRIPTION]"
- **Link**: `/dashboard`
- **Use Case**: Product updates and feature launches

### 4. Payment Processing Issue
- **ID**: `payment_issue`
- **Title**: "Payment Processing Update"
- **Message**: "We are experiencing temporary issues with payment processing. Please try again in a few minutes."
- **Link**: `/support`
- **Use Case**: Payment system outages or issues

### 5. Review Processing Delay
- **ID**: `review_delay`
- **Title**: "Review Processing Delay"
- **Message**: "We are experiencing higher than usual review volumes. Your review may take longer than expected. Thank you for your patience."
- **Link**: `/dashboard`
- **Use Case**: High volume periods or reviewer availability issues

### 6. Security Update
- **ID**: `security`
- **Title**: "Security Update"
- **Message**: "For your security, please update your password if you haven't done so recently."
- **Link**: `/dashboard/settings`
- **Use Case**: Security advisories or password policy changes

### 7. Special Promotion
- **ID**: `promo`
- **Title**: "Special Promotion"
- **Message**: "Limited time offer: [PROMO_DETAILS]. Use code [CODE] at checkout."
- **Link**: `/marketplace`
- **Use Case**: Promotional campaigns and discounts

### 8. Policy Update
- **ID**: `policy`
- **Title**: "Policy Update"
- **Message**: "We have updated our terms of service and privacy policy. Please review the changes."
- **Link**: `/about`
- **Use Case**: Legal updates and policy changes

---

## Error & System Notifications

### Database Errors
- **Trigger**: When critical database operations fail
- **Recipient**: Admin users only
- **Type**: `system`
- **Implementation**: To be added in error handlers

### API Errors
- **Trigger**: When external API calls fail (Stripe, etc.)
- **Recipient**: Admin users only
- **Type**: `system`
- **Implementation**: To be added in API error handlers

### File Upload Errors
- **Trigger**: When file uploads to Supabase Storage fail
- **Recipient**: User who attempted upload
- **Type**: `system`
- **Implementation**: To be added in upload handlers

---

## Implementation Guidelines

### Adding New Triggers

1. **Identify the trigger point** (webhook, action, event)
2. **Determine the recipient** (single user, role-based, all users)
3. **Create the notification** using `createNotification()` or `sendSiteWideNotification()`
4. **Add error handling** to prevent notification failures from breaking the main flow
5. **Document the trigger** in this file

### Best Practices

- **Always use service role client** for notifications triggered by webhooks or server actions
- **Catch and log errors** without failing the main operation
- **Use appropriate notification types** for filtering and routing
- **Include relevant links** to help users take action
- **Keep messages concise** but informative
- **Test notifications** in development before deploying

### Example: Adding a New Trigger

```typescript
// In your action/webhook file
import { createNotification } from '@/app/actions/notifications'

// After successful operation
await createNotification(
  userId,
  'Operation Complete',
  'Your request has been processed successfully.',
  '/dashboard',
  'system'
).catch((err) => {
  // Log but don't fail the main operation
  console.error('Error creating notification:', err)
})
```

---

## Future Enhancements

- [ ] Email notifications (optional opt-in)
- [ ] Push notifications (browser notifications)
- [ ] Notification preferences (user settings)
- [ ] Scheduled notifications (send at specific time)
- [ ] Role-based notifications (target specific user roles)
- [ ] Notification analytics (track open rates, click rates)
- [ ] Notification batching (group similar notifications)

---

## Testing

To test notifications:

1. **Payment Notification**: Complete a test checkout in Stripe test mode
2. **Review Notification**: Submit a review as a reviewer
3. **Site-Wide Notification**: Use Admin Dashboard → Notification Broadcast
4. **Welcome Notification**: Create a new user account

All notifications should appear in the notification bell icon in the navbar.

