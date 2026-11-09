const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');
  await page.goto(htmlPath);
  await page.waitForTimeout(600);

  // Scroll down and screenshot sections
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'mobile-playground.png') });

  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'mobile-docs.png') });

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'mobile-gallery.png') });

  await page.close();
  await browser.close();
})();
