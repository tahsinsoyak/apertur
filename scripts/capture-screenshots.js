const fs = require('fs');
const path = require('path');

const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'laptop-1024', width: 1024, height: 768 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(htmlPath);
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, `${vp.name}-top.png`) });
    console.log(`Saved screenshot: ${vp.name}-top.png`);
    await page.close();
  }

  await browser.close();
}

captureScreenshots().catch(console.error);
