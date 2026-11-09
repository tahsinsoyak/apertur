const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');
  await page.goto(htmlPath);
  await page.click('#btnNavToggle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'drawer-open-mobile.png') });
  await browser.close();
})();
