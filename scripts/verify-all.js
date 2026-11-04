const fs = require('fs');
const path = require('path');

const playwrightPath = fs.existsSync('C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright')
  ? 'C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright'
  : 'playwright';
const { chromium } = require(playwrightPath);

const EXTENSION_PATH = path.resolve(__dirname, '..');

async function run() {
  console.log('Launching browser with extension from:', EXTENSION_PATH);
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox'
    ]
  });

  try {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    console.log('Extension loaded! ID:', extensionId);

    // 1. Test Popup Dimensions and Overflow
    console.log('\n--- Test 1: Popup Dimensions & Layout ---');
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await popupPage.waitForLoadState('networkidle');

    const layoutMetrics = await popupPage.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const header = document.querySelector('.app-header');
      const headerRight = document.querySelector('.header-right');
      const brand = document.querySelector('.brand');
      return {
        bodyClientWidth: body.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientHeight: body.clientHeight,
        bodyScrollHeight: body.scrollHeight,
        docClientHeight: doc.clientHeight,
        docScrollHeight: doc.scrollHeight,
        headerWidth: header ? header.getBoundingClientRect().width : null,
        brandWidth: brand ? brand.getBoundingClientRect().width : null,
        headerRightWidth: headerRight ? headerRight.getBoundingClientRect().width : null,
        hasHorizontalOverflow: body.scrollWidth > body.clientWidth,
        hasVerticalOverflow: body.scrollHeight > 590
      };
    });
    console.log('Popup Layout Metrics:', layoutMetrics);

    // 2. Test Screenshot Menu dropdown
    console.log('\n--- Test 2: Screenshot Menu Dropdown ---');
    await popupPage.click('#btnQuickScreenshot');
    const isMenuVisible = await popupPage.evaluate(() => {
      const menu = document.getElementById('screenshotMenu');
      return menu && !menu.classList.contains('hidden') && window.getComputedStyle(menu).display !== 'none';
    });
    console.log('Screenshot menu opened:', isMenuVisible);

    // Click outside to close
    await popupPage.click('.app-header');
    const isMenuClosed = await popupPage.evaluate(() => {
      const menu = document.getElementById('screenshotMenu');
      return menu && menu.classList.contains('hidden');
    });
    console.log('Screenshot menu closed on outside click:', isMenuClosed);

    // 3. Test Preview Page (Gallery & Modal)
    console.log('\n--- Test 3: Media Library Preview ---');
    const previewPage = await context.newPage();
    await previewPage.goto(`chrome-extension://${extensionId}/preview/preview.html?view=gallery`);
    await previewPage.waitForLoadState('networkidle');

    // Add a mock screenshot and mock video to IndexedDB directly to test rendering
    await previewPage.evaluate(async () => {
      if (window.RecorderDB) {
        await window.RecorderDB.saveScreenshot({
          id: 'test-snap-1',
          title: 'Test Fullpage Website',
          timestamp: Date.now(),
          dimensions: { width: 1920, height: 4500 },
          size: 1024 * 512,
          type: 'screenshot',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });
      }
    });

    // Reload gallery
    await previewPage.reload();
    await previewPage.waitForLoadState('networkidle');

    const galleryState = await previewPage.evaluate(() => {
      const cards = document.querySelectorAll('.gallery-card');
      const snapCard = document.querySelector('.gallery-card.screenshot-item');
      const summary = document.getElementById('gallerySummaryText')?.textContent;
      return {
        totalCards: cards.length,
        hasScreenshotCard: Boolean(snapCard),
        summaryText: summary
      };
    });
    console.log('Gallery State:', galleryState);

    // Click on the screenshot card to open modal
    await previewPage.click('.gallery-card.screenshot-item .gallery-thumbnail-box');
    const modalVisible = await previewPage.evaluate(() => {
      const modal = document.getElementById('imageViewerModal');
      return modal && !modal.classList.contains('hidden');
    });
    console.log('Image Modal Opened:', modalVisible);

    console.log('\nAll direct browser tests completed successfully!');
  } finally {
    await context.close();
  }
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
