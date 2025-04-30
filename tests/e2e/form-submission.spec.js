// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Catering Form Submission', () => {
  // This flag tells our test to validate but not complete the actual submission
  const testParams = '?testMode=true&disableTripleseat=true';
  
  test('Ladybird form submission', async ({ page }) => {
    // Navigate to the form
    await page.goto('/ladybird-catering.html' + testParams);
    
    // Fill out the contact information
    await page.fill('#contactName', 'Automated Test User');
    await page.fill('#contactEmail', 'test@electric-hospitality.com');
    await page.fill('#contactPhone', '555-123-4567');
    
    // Fill out the delivery information
    await page.fill('#locationField', 'Test Location');
    
    // Set the date to 3 days from now (to pass 72 hour validation)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.fill('#dropoffDate', dateString);
    
    // Set the dropoff time
    await page.selectOption('#dropoffTime', '12:00 PM');
    
    // Select party size
    await page.click('#partySize25');
    
    // Add some items to the order (at least one main and one side)
    const mainItems = await page.$$('table#mainsTable tbody tr');
    if (mainItems.length > 0) {
      await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    const sideItems = await page.$$('table#sidesTable tbody tr');
    if (sideItems.length > 0) {
      await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    // Submit the form
    await page.click('#submitButton');
    
    // Wait for submission validation
    await page.waitForSelector('.notification-success', { timeout: 10000 });
    
    // Check that the success message appears
    const successMsg = await page.textContent('.notification-success');
    expect(successMsg).toContain('TEST MODE');
    
    // Verify no error messages
    const errorExists = await page.$('.notification-error');
    expect(errorExists).toBeNull();
  });

  test('Muchacho form submission', async ({ page }) => {
    // Navigate to the form
    await page.goto('/muchacho-catering.html' + testParams);
    
    // Fill out the contact information
    await page.fill('#contactName', 'Automated Test User');
    await page.fill('#contactEmail', 'test@electric-hospitality.com');
    await page.fill('#contactPhone', '555-123-4567');
    
    // Fill out the delivery information
    await page.fill('#locationField', 'Test Location');
    
    // Set the date to 3 days from now (to pass 72 hour validation)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.fill('#dropoffDate', dateString);
    
    // Set the dropoff time
    await page.selectOption('#dropoffTime', '12:00 PM');
    
    // Select party size
    await page.click('#partySize25');
    
    // Add some items to the order (at least one main and one side)
    const mainItems = await page.$$('table#mainsTable tbody tr');
    if (mainItems.length > 0) {
      await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    const sideItems = await page.$$('table#sidesTable tbody tr');
    if (sideItems.length > 0) {
      await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    // Submit the form
    await page.click('#submitButton');
    
    // Wait for submission validation
    await page.waitForSelector('.notification-success', { timeout: 10000 });
    
    // Check that the success message appears
    const successMsg = await page.textContent('.notification-success');
    expect(successMsg).toContain('TEST MODE');
    
    // Verify no error messages
    const errorExists = await page.$('.notification-error');
    expect(errorExists).toBeNull();
  });

  test('Dug-Out form submission', async ({ page }) => {
    // Navigate to the form
    await page.goto('/the-dug-out-catering.html' + testParams);
    
    // Fill out the contact information
    await page.fill('#contactName', 'Automated Test User');
    await page.fill('#contactEmail', 'test@electric-hospitality.com');
    await page.fill('#contactPhone', '555-123-4567');
    
    // Fill out the delivery information
    await page.fill('#locationField', 'Test Location');
    
    // Set the date to 3 days from now (to pass 72 hour validation)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.fill('#dropoffDate', dateString);
    
    // Set the dropoff time
    await page.selectOption('#dropoffTime', '12:00 PM');
    
    // Select party size
    await page.click('#partySize25');
    
    // Add some items to the order (at least one main and one side)
    const mainItems = await page.$$('table#mainsTable tbody tr');
    if (mainItems.length > 0) {
      await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    const sideItems = await page.$$('table#sidesTable tbody tr');
    if (sideItems.length > 0) {
      await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
    }
    
    // Submit the form
    await page.click('#submitButton');
    
    // Wait for submission validation
    await page.waitForSelector('.notification-success', { timeout: 10000 });
    
    // Check that the success message appears
    const successMsg = await page.textContent('.notification-success');
    expect(successMsg).toContain('TEST MODE');
    
    // Verify no error messages
    const errorExists = await page.$('.notification-error');
    expect(errorExists).toBeNull();
  });
}); 