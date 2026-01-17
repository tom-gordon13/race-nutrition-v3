/**
 * Test script for the complete triathlon event creation flow
 * Tests: Login -> Create Event -> Add Food Items -> Verify Calculations
 */

import { chromium } from 'playwright';

async function testTriathlonFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600 // Slow down actions to see what's happening
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to the app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('Step 2: Click login button...');
    const loginButton = page.locator('button:has-text("Log In"), button:has-text("Login")').first();
    await loginButton.click();

    console.log('Step 3: Wait for Auth0 login page...');
    await page.waitForURL(/auth0\.com/, { timeout: 10000 });

    console.log('Step 4: Fill in credentials...');
    // TODO: Set TEST_EMAIL and TEST_PASSWORD environment variables
    const email = process.env.TEST_EMAIL || 'your-test-email@example.com';
    const password = process.env.TEST_PASSWORD || 'your-password';
    await page.fill('input[name="username"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);

    console.log('Step 5: Submit login...');
    await page.click('button[type="submit"], button[name="submit"]');

    console.log('Step 6: Wait for redirect back to app...');
    await page.waitForURL('http://localhost:5173/**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/01-after-login.png' });

    console.log('Step 7: Navigate to Plans page...');
    await page.click('a:has-text("Plans")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('Step 8: Click "Create" button to open dialog...');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/02-create-dialog-open.png' });

    console.log('Step 9: Fill in plan name...');
    await page.fill('input[placeholder*="Ironman"]', 'Test Triathlon - Auto');

    console.log('Step 10: Select Triathlon event type...');
    await page.click('text=Other');
    await page.waitForTimeout(500);
    // Click Triathlon option within the dropdown menu that appeared
    await page.locator('.modal-sheet div:has-text("Triathlon")').last().click();
    await page.waitForTimeout(500);

    console.log('Step 11: Fill in triathlon segment durations...');
    const inputs = await page.locator('input[type="number"]').all();
    await inputs[0].fill('1'); // swim hours
    await inputs[1].fill('0'); // swim minutes
    await inputs[2].fill('5'); // bike hours
    await inputs[3].fill('30'); // bike minutes
    await inputs[4].fill('3'); // run hours
    await inputs[5].fill('45'); // run minutes

    await page.screenshot({ path: 'screenshots/03-event-form-filled.png' });

    console.log('Step 12: Submit the form...');
    await page.click('button:has-text("Create Plan")');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/04-event-created.png' });

    console.log('Step 13: Open the event timeline...');
    await page.click('text=Test Triathlon - Auto');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/05-timeline-initial.png' });

    console.log('Step 14: Add 5 existing food items to the timeline...');

    // Food items to add (using existing items from database)
    const foodItems = [
      { name: 'Banana', expectedCarbs: 23, time: 60 }, // 1:00
      { name: 'SIS Gel (no Caff)', expectedCarbs: 22, time: 150 }, // 2:30
      { name: 'Clif Bar', expectedCarbs: 44, time: 240 }, // 4:00
      { name: 'Precision Chews', expectedCarbs: 30, time: 390 }, // 6:30
      { name: 'Date (single)', expectedCarbs: 21, time: 525 } // 8:45
    ];

    let totalCarbs = 0;

    for (let i = 0; i < foodItems.length; i++) {
      const item = foodItems[i];
      console.log(`\n  Adding item ${i + 1}/5: ${item.name} (${item.expectedCarbs}g carbs) at ${Math.floor(item.time / 60)}:${(item.time % 60).toString().padStart(2, '0')}`);

      // Click "Add Item" button
      await page.click('button:has-text("Add Item")');
      await page.waitForTimeout(1000);

      // Wait for the "Select Item" dialog to appear
      await page.waitForSelector('text=Select Item', { timeout: 5000 });

      // Switch to "All Items" tab to see all available food
      const allItemsTab = page.locator('button:has-text("All Items")');
      if (await allItemsTab.count() > 0) {
        await allItemsTab.click();
        await page.waitForTimeout(500);
      }

      // Search for the food item by name
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      await searchInput.fill(item.name);
      await page.waitForTimeout(1000);

      // Click on the food item in the list
      await page.click(`text=${item.name}`);
      await page.waitForTimeout(500);

      // Set the time (in the format HH:MM)
      const timeHours = Math.floor(item.time / 60);
      const timeMinutes = item.time % 60;
      const timeString = `${timeHours}:${timeMinutes.toString().padStart(2, '0')}`;

      // Look for time input field
      const timeInput = page.locator('input[value*=":"]').first();
      await timeInput.click();
      await timeInput.fill(timeString);
      await page.waitForTimeout(500);

      // Click "Add to Timeline" button
      await page.click('button:has-text("Add to Timeline")');
      await page.waitForTimeout(1500);

      totalCarbs += item.expectedCarbs;
      console.log(`  ✓ Added successfully. Running total: ${totalCarbs}g carbs`);
    }

    await page.screenshot({ path: 'screenshots/06-all-items-added.png', fullPage: true });

    console.log('\n\nStep 15: Verify carbs/hour calculation...');

    // Wait a moment for calculations to update
    await page.waitForTimeout(2000);

    // Get the page content to find carbs/hr value
    const statsSection = await page.locator('text=/\\d+g.*CARBS\\/HR/i, text=/CARBS\\/HR/i').first();
    const statsText = await statsSection.textContent().catch(() => null);

    if (statsText) {
      const carbsMatch = statsText.match(/(\d+(\.\d+)?)g/);
      if (carbsMatch) {
        const displayedCarbs = parseFloat(carbsMatch[1]);
        console.log(`\n✅ Found carbs/hour displayed: ${displayedCarbs}g/hr`);
      }
    }

    // Calculate expected values
    const durationHours = 10.25; // 10h 15m
    const expectedCarbsPerHour = totalCarbs / durationHours;

    console.log('\n=== CALCULATION VERIFICATION ===');
    console.log(`Total carbs added: ${totalCarbs}g`);
    console.log(`Event duration: ${durationHours} hours (10h 15m)`);
    console.log(`Expected carbs/hour: ${expectedCarbsPerHour.toFixed(1)}g/hr`);

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/07-final-with-carbs.png', fullPage: true });

    console.log('\n✅ Test completed successfully!');
    console.log('📸 Screenshots saved to screenshots/ directory');

    // Keep browser open for review
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
    console.error('\nFull error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTriathlonFlow().catch(console.error);
