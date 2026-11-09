const fs = require('fs');
const path = require('path');
const playwrightPath = fs.existsSync('C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright')
  ? 'C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright'
  : 'playwright';
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  
  const sponsor = page.locator('#sponsor');
  await sponsor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await sponsor.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'sponsor-desktop.png') });
  console.log('Saved sponsor-desktop.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await sponsor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await sponsor.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'sponsor-mobile.png') });
  console.log('Saved sponsor-mobile.png');

  await browser.close();
})();
