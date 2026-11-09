const fs = require('fs');
const path = require('path');

const { chromium } = require('playwright');

async function testResponsive() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'Mobile (iPhone 12)', width: 390, height: 844 },
    { name: 'Tablet (iPad Mini)', width: 768, height: 1024 },
    { name: 'Small Laptop', width: 1024, height: 768 },
    { name: 'Desktop HD', width: 1200, height: 800 }
  ];

  const htmlPath = 'file:///' + path.join(__dirname, '..', 'landing', 'index.html').replace(/\\/g, '/');
  console.log(`Testing: ${htmlPath}`);

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(htmlPath);
    await page.waitForLoadState('domcontentloaded');

    const metrics = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;
      const overflows = [];

      // Find elements that exceed clientWidth
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 1) {
          overflows.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      }

      return {
        clientWidth,
        scrollWidth,
        hasOverflow: scrollWidth > clientWidth,
        overflowCount: overflows.length,
        topOverflows: overflows.slice(0, 5)
      };
    });

    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    console.log(`clientWidth: ${metrics.clientWidth}, scrollWidth: ${metrics.scrollWidth}, Overflow: ${metrics.hasOverflow}`);
    if (metrics.hasOverflow) {
      console.log('Sample overflowing elements:', JSON.stringify(metrics.topOverflows, null, 2));
    }

    await page.close();
  }

  await browser.close();
}

testResponsive().catch(err => {
  console.error(err);
  process.exit(1);
});
