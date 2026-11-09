const fs = require('fs');
const path = require('path');

const playwrightPath = fs.existsSync('C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright')
  ? 'C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright'
  : 'playwright';
const { chromium } = require(playwrightPath);

async function testNavbarInteractions() {
  console.log('Testing Mobile Navigation Drawer Interactions...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');
  await page.goto(htmlPath);
  await page.waitForLoadState('domcontentloaded');

  // 1. Verify toggle button is visible on mobile and drawer is initially closed
  const isToggleVisible = await page.isVisible('#btnNavToggle');
  if (!isToggleVisible) throw new Error('#btnNavToggle should be visible on 390px');

  const isDrawerOpenInitial = await page.evaluate(() => {
    const drawer = document.getElementById('mobileNavDrawer');
    return drawer.classList.contains('open') && window.getComputedStyle(drawer).display !== 'none';
  });
  if (isDrawerOpenInitial) throw new Error('Mobile drawer should be closed initially');
  console.log('✓ Initial state: toggle visible, drawer hidden');

  // 2. Click hamburger toggle button -> drawer should open
  await page.click('#btnNavToggle');
  const isDrawerOpenAfterClick = await page.evaluate(() => {
    const drawer = document.getElementById('mobileNavDrawer');
    return drawer.classList.contains('open') && window.getComputedStyle(drawer).display === 'block';
  });
  if (!isDrawerOpenAfterClick) throw new Error('Drawer did not open upon clicking #btnNavToggle');
  console.log('✓ Drawer opens cleanly upon clicking #btnNavToggle');

  // 3. Click outside -> drawer should close
  await page.mouse.click(10, 720); // Click outside drawer (below bottom 654)
  const isDrawerOpenAfterOutsideClick = await page.evaluate(() => {
    const drawer = document.getElementById('mobileNavDrawer');
    return drawer.classList.contains('open');
  });
  if (isDrawerOpenAfterOutsideClick) throw new Error('Drawer did not close upon outside click');
  console.log('✓ Drawer closes on outside click');

  // 4. Open again and press Escape key -> should close
  await page.click('#btnNavToggle');
  await page.keyboard.press('Escape');
  const isDrawerOpenAfterEsc = await page.evaluate(() => {
    const drawer = document.getElementById('mobileNavDrawer');
    return drawer.classList.contains('open');
  });
  if (isDrawerOpenAfterEsc) throw new Error('Drawer did not close upon pressing Escape');
  console.log('✓ Drawer closes on Escape key');

  // 5. Open again and click a link inside drawer -> should close
  await page.click('#btnNavToggle');
  await page.click('#mobileNavDrawer a[href="#docs"]');
  const isDrawerOpenAfterLinkClick = await page.evaluate(() => {
    const drawer = document.getElementById('mobileNavDrawer');
    return drawer.classList.contains('open');
  });
  if (isDrawerOpenAfterLinkClick) throw new Error('Drawer did not close upon clicking a navigation link');
  console.log('✓ Drawer closes on clicking navigation link');

  await page.close();
  await browser.close();
  console.log('🎉 All mobile navigation drawer interaction tests passed 100%!');
}

testNavbarInteractions().catch(err => {
  console.error(err);
  process.exit(1);
});
