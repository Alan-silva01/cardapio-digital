const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    isMobile: true,
  });
  const page = await context.newPage();
  
  // Navigate to the product list (HomeApp)
  await page.goto('http://localhost:3000/menu');
  
  // Click on a beer item to open the product screen (MenuApp)
  console.log("Waiting for menu item...");
  await page.waitForTimeout(3000);
  await page.click('text=Heineken LN', { timeout: 3000 }).catch(() => console.log("Heineken not found, trying anything"));
  if (await page.$('.produto-card')) {
     await page.click('.produto-card');
  }

  // Check if we are in the product view
  console.log("Waiting for product overlay...");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_menu_app_bottom_nav.png' });
  console.log("Screenshot saved.");

  await browser.close();
})();
