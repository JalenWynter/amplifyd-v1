import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

// "God Mode" Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_EMAIL = `e2e_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
const TEST_PASSWORD = 'Password123!';
const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const TEST_TRACK_PATH = path.join(FIXTURE_DIR, `track_${Date.now()}.mp3`);

test.describe('Artist Full Lifecycle', () => {
  // Use sequential mode to prevent race conditions on file cleanup
  test.describe.configure({ mode: 'serial' });

  let userId: string;
  let orderId: string;

  // 1. SETUP: Create a dummy MP3 file BEFORE EACH test
  test.beforeAll(async () => {
    if (!fs.existsSync(FIXTURE_DIR)) {
      fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    }
    const buffer = Buffer.alloc(100 * 1024); // 100KB dummy file
    fs.writeFileSync(TEST_TRACK_PATH, buffer);
    console.log('✅ Setup: Created dummy MP3 file');
  });

  // 2. THE TEST
  test('Complete Flow', async ({ page }) => {
    // Increase timeout for slow dev servers
    test.setTimeout(60000);

    // --- STEP 1: SIGNUP ---
    console.log(`🔹 Step 1: Creating Account for ${TEST_EMAIL}`);
    await page.goto('http://localhost:3000/signup');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for the redirect to dashboard (CONFIRMS LOGIN)
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✅ Signup successful, redirected to Dashboard');

    // Get User ID from DB for cleanup later
    const { data: user } = await supabase.from('profiles').select('id').eq('email', TEST_EMAIL).single();
    if (user) userId = user.id;

    // --- STEP 2: UPLOAD (HOME PAGE) ---
    console.log('🔹 Step 2: Uploading Track');
    await page.goto('http://localhost:3000/');
    
    // Wait for Hero section to be ready
    await expect(page.locator('input[type="file"]')).toBeAttached();
    
    // Upload the file
    await page.setInputFiles('input[type="file"]', TEST_TRACK_PATH);
    
    // Wait for the modal to appear (Select Reviewer)
    await expect(page.getByText('Select Your Reviewer')).toBeVisible({ timeout: 20000 });
    console.log('✅ Upload successful, Modal Open');

    // --- STEP 3: SELECT REVIEWER ---
    console.log('🔹 Step 3: Selecting Reviewer');
    // Force click the first "Book Now" button
    await page.locator('button:has-text("Book Now")').first().click({ force: true });
    
    // Verify checkout page
    await expect(page).toHaveURL(/.*checkout/);
    console.log('✅ Redirected to Checkout');

    // --- STEP 4: CHECKOUT FORM ---
    console.log('🔹 Step 4: Filling Checkout Form');
    // Use more specific locators
    await page.locator('input#trackTitle').fill('E2E Masterpiece');
    await page.locator('textarea#note').fill('Automated test note.');
    await page.click('button:has-text("Proceed to Payment")');

    // Wait for Stripe Element (iframe) or "Payment" header
    await expect(page.getByText('Payment', { exact: true })).toBeVisible({ timeout: 15000 });
    console.log('✅ Order Created (Pending Payment)');

    // --- STEP 5: SIMULATE PAYMENT (BACKEND HACK) ---
    console.log('🔹 Step 5: Simulating Payment via DB');
    
    // Find the order we just made
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('track_title', 'E2E Masterpiece')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (!order) throw new Error('Order not found in DB!');
    orderId = order.id;

    // Force update status to 'paid'
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
    console.log(`✅ DB Hacked: Order ${orderId} set to 'paid'`);

    // --- STEP 6: VERIFY DASHBOARD ---
    console.log('🔹 Step 6: Verifying Dashboard');
    await page.goto('http://localhost:3000/dashboard/artist');
    
    // Check for the "In Review" badge
    await expect(page.getByText('E2E Masterpiece')).toBeVisible();
    await expect(page.getByText('In Review')).toBeVisible();
    
    console.log('🎉 TEST PASSED: Flow Complete');
  });

  // 3. CLEANUP
  test.afterAll(async () => {
    console.log('🧹 Cleaning Up...');
    if (orderId) {
      await supabase.from('reviews').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    }
    // Delete auth user (cascades to profiles)
    if (userId) {
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const userToDelete = authUser.users.find(u => u.email === TEST_EMAIL);
      if (userToDelete) await supabase.auth.admin.deleteUser(userToDelete.id);
    }
    // Delete file
    if (fs.existsSync(TEST_TRACK_PATH)) {
        fs.unlinkSync(TEST_TRACK_PATH);
    }
    console.log('✅ Cleanup Complete');
  });
});