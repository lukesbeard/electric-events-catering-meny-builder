# Test info

- Name: Catering Form Submission >> Muchacho form submission
- Location: /Users/lukebeard/Documents/GitHub/electric-events-catering-meny-builder/tests/e2e/form-submission.spec.js:58:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/lukebeard/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | // @ts-check
   2 | import { test, expect } from '@playwright/test';
   3 |
   4 | test.describe('Catering Form Submission', () => {
   5 |   // This flag tells our test to validate but not complete the actual submission
   6 |   const testParams = '?testMode=true&disableTripleseat=true';
   7 |   
   8 |   test('Ladybird form submission', async ({ page }) => {
   9 |     // Navigate to the form
   10 |     await page.goto('/ladybird-catering.html' + testParams);
   11 |     
   12 |     // Fill out the contact information
   13 |     await page.fill('#contactName', 'Automated Test User');
   14 |     await page.fill('#contactEmail', 'test@electric-hospitality.com');
   15 |     await page.fill('#contactPhone', '555-123-4567');
   16 |     
   17 |     // Fill out the delivery information
   18 |     await page.fill('#locationField', 'Test Location');
   19 |     
   20 |     // Set the date to 3 days from now (to pass 72 hour validation)
   21 |     const futureDate = new Date();
   22 |     futureDate.setDate(futureDate.getDate() + 3);
   23 |     const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
   24 |     await page.fill('#dropoffDate', dateString);
   25 |     
   26 |     // Set the dropoff time
   27 |     await page.selectOption('#dropoffTime', '12:00 PM');
   28 |     
   29 |     // Select party size
   30 |     await page.click('#partySize25');
   31 |     
   32 |     // Add some items to the order (at least one main and one side)
   33 |     const mainItems = await page.$$('table#mainsTable tbody tr');
   34 |     if (mainItems.length > 0) {
   35 |       await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
   36 |     }
   37 |     
   38 |     const sideItems = await page.$$('table#sidesTable tbody tr');
   39 |     if (sideItems.length > 0) {
   40 |       await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
   41 |     }
   42 |     
   43 |     // Submit the form
   44 |     await page.click('#submitButton');
   45 |     
   46 |     // Wait for submission validation
   47 |     await page.waitForSelector('.notification-success', { timeout: 10000 });
   48 |     
   49 |     // Check that the success message appears
   50 |     const successMsg = await page.textContent('.notification-success');
   51 |     expect(successMsg).toContain('TEST MODE');
   52 |     
   53 |     // Verify no error messages
   54 |     const errorExists = await page.$('.notification-error');
   55 |     expect(errorExists).toBeNull();
   56 |   });
   57 |
>  58 |   test('Muchacho form submission', async ({ page }) => {
      |   ^ Error: browserType.launch: Executable doesn't exist at /Users/lukebeard/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell
   59 |     // Navigate to the form
   60 |     await page.goto('/muchacho-catering.html' + testParams);
   61 |     
   62 |     // Fill out the contact information
   63 |     await page.fill('#contactName', 'Automated Test User');
   64 |     await page.fill('#contactEmail', 'test@electric-hospitality.com');
   65 |     await page.fill('#contactPhone', '555-123-4567');
   66 |     
   67 |     // Fill out the delivery information
   68 |     await page.fill('#locationField', 'Test Location');
   69 |     
   70 |     // Set the date to 3 days from now (to pass 72 hour validation)
   71 |     const futureDate = new Date();
   72 |     futureDate.setDate(futureDate.getDate() + 3);
   73 |     const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
   74 |     await page.fill('#dropoffDate', dateString);
   75 |     
   76 |     // Set the dropoff time
   77 |     await page.selectOption('#dropoffTime', '12:00 PM');
   78 |     
   79 |     // Select party size
   80 |     await page.click('#partySize25');
   81 |     
   82 |     // Add some items to the order (at least one main and one side)
   83 |     const mainItems = await page.$$('table#mainsTable tbody tr');
   84 |     if (mainItems.length > 0) {
   85 |       await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
   86 |     }
   87 |     
   88 |     const sideItems = await page.$$('table#sidesTable tbody tr');
   89 |     if (sideItems.length > 0) {
   90 |       await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
   91 |     }
   92 |     
   93 |     // Submit the form
   94 |     await page.click('#submitButton');
   95 |     
   96 |     // Wait for submission validation
   97 |     await page.waitForSelector('.notification-success', { timeout: 10000 });
   98 |     
   99 |     // Check that the success message appears
  100 |     const successMsg = await page.textContent('.notification-success');
  101 |     expect(successMsg).toContain('TEST MODE');
  102 |     
  103 |     // Verify no error messages
  104 |     const errorExists = await page.$('.notification-error');
  105 |     expect(errorExists).toBeNull();
  106 |   });
  107 |
  108 |   test('Dug-Out form submission', async ({ page }) => {
  109 |     // Navigate to the form
  110 |     await page.goto('/the-dug-out-catering.html' + testParams);
  111 |     
  112 |     // Fill out the contact information
  113 |     await page.fill('#contactName', 'Automated Test User');
  114 |     await page.fill('#contactEmail', 'test@electric-hospitality.com');
  115 |     await page.fill('#contactPhone', '555-123-4567');
  116 |     
  117 |     // Fill out the delivery information
  118 |     await page.fill('#locationField', 'Test Location');
  119 |     
  120 |     // Set the date to 3 days from now (to pass 72 hour validation)
  121 |     const futureDate = new Date();
  122 |     futureDate.setDate(futureDate.getDate() + 3);
  123 |     const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  124 |     await page.fill('#dropoffDate', dateString);
  125 |     
  126 |     // Set the dropoff time
  127 |     await page.selectOption('#dropoffTime', '12:00 PM');
  128 |     
  129 |     // Select party size
  130 |     await page.click('#partySize25');
  131 |     
  132 |     // Add some items to the order (at least one main and one side)
  133 |     const mainItems = await page.$$('table#mainsTable tbody tr');
  134 |     if (mainItems.length > 0) {
  135 |       await mainItems[0].$('input[type="number"]').then(input => input.fill('1'));
  136 |     }
  137 |     
  138 |     const sideItems = await page.$$('table#sidesTable tbody tr');
  139 |     if (sideItems.length > 0) {
  140 |       await sideItems[0].$('input[type="number"]').then(input => input.fill('1'));
  141 |     }
  142 |     
  143 |     // Submit the form
  144 |     await page.click('#submitButton');
  145 |     
  146 |     // Wait for submission validation
  147 |     await page.waitForSelector('.notification-success', { timeout: 10000 });
  148 |     
  149 |     // Check that the success message appears
  150 |     const successMsg = await page.textContent('.notification-success');
  151 |     expect(successMsg).toContain('TEST MODE');
  152 |     
  153 |     // Verify no error messages
  154 |     const errorExists = await page.$('.notification-error');
  155 |     expect(errorExists).toBeNull();
  156 |   });
  157 | }); 
```