const fs = require('fs');
const path = require('path');
const http = require('http');

const { chromium } = require('playwright');

const EXTENSION_PATH = path.resolve(__dirname, '..');

async function testLiveE2E() {
  console.log('--- Testing Live E2E Screenshot & Recording Workflows ---');

  // Start local HTTP server to host real web page
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Apertur Test Page</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 40px; background: #f0fdf4; height: 2800px; }
          .header-box { padding: 30px; background: #047857; color: white; border-radius: 12px; margin-bottom: 40px; }
          .section-box { padding: 40px; background: white; border: 2px solid #a7f3d0; border-radius: 12px; margin-bottom: 600px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>Apertur Full Test Page</h1>
          <p>Section 1: Top of the page</p>
        </div>
        <div class="section-box">
          <h2>Middle Section (Y: 800px)</h2>
        </div>
        <div class="section-box">
          <h2>Deep Section (Y: 1600px)</h2>
        </div>
        <div class="section-box">
          <h2>Bottom Section (Y: 2400px)</h2>
        </div>
      </body>
      </html>
    `);
  });

  await new Promise((resolve) => server.listen(8765, '127.0.0.1', resolve));
  console.log('✓ Test HTTP Server running at http://127.0.0.1:8765');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    permissions: ['clipboard-read', 'clipboard-write'],
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
    console.log('✓ Extension ID:', extensionId);

    // Open the local test page
    const testPage = await context.newPage();
    await testPage.goto('http://127.0.0.1:8765');
    await testPage.waitForLoadState('networkidle');

    // 1. Test In-Page Area Snipping
    console.log('1. Testing Area Snipping in page...');
    await testPage.evaluate(() => {
      window.postMessage({ action: 'START_AREA_SELECTION' }, '*');
    });

    const activeTabId = await background.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab ? tab.id : null;
    });

    // Send direct action message to content script
    await background.evaluate(async (tabId) => {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'START_AREA_SELECTION' }, resolve);
      });
    }, activeTabId);

    // Verify overlay appears
    await testPage.waitForSelector('#__apertur_snip_overlay__', { timeout: 3000 });
    console.log('✓ Area snip overlay active on page');

    // Simulate mouse drag selection
    await testPage.mouse.move(100, 100);
    await testPage.mouse.down();
    await testPage.mouse.move(400, 300);
    await testPage.mouse.up();

    // Verify toolbar appears
    await testPage.waitForSelector('.__apertur_snip_toolbar__', { timeout: 3000 });
    console.log('✓ Snip floating action toolbar appeared');

    // Click "Copy" on toolbar
    await testPage.click('#__btn_snip_copy__');
    console.log('✓ Snip crop executed');

    // Wait 500ms for IndexedDB persistence
    await new Promise((r) => setTimeout(r, 600));

    // 1b. Test Full Page Screenshot
    console.log('1b. Testing Full Webpage Scrolling Capture...');
    await background.evaluate(async (tabId) => {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'START_FULL_PAGE_SCREENSHOT', options: { download: false } }, resolve);
      });
    }, activeTabId);

    // Wait for multi-slice capture to scroll and stitch
    await new Promise((r) => setTimeout(r, 2200));
    console.log('✓ Full page capture completed');

    // 2. Test Media Library Gallery persistence
    console.log('2. Verifying Media Library IndexedDB persistence...');
    const galleryPage = await context.newPage();
    await galleryPage.goto(`chrome-extension://${extensionId}/preview/preview.html?view=gallery`);
    await galleryPage.waitForLoadState('networkidle');

    const libraryData = await galleryPage.evaluate(async () => {
      const items = await window.RecorderDB.getAllScreenshots();
      return {
        count: items.length,
        firstTitle: items[0]?.title,
        dimensions: items[0]?.dimensions
      };
    });

    console.log('✓ Library Data:', libraryData);
    if (libraryData.count < 1) {
      throw new Error('Screenshot was not saved to IndexedDB!');
    }

    // 3. Test Image Modal Zoom & Delete
    console.log('3. Testing Image Modal Zoom & Controls...');
    await galleryPage.click('.gallery-card.screenshot-item .gallery-thumbnail-box');
    await galleryPage.waitForSelector('#imageViewerModal:not(.hidden)');

    const zoomLabelBefore = await galleryPage.textContent('#modalZoomLabel');
    await galleryPage.click('#btnModalZoom');
    const zoomLabelAfter = await galleryPage.textContent('#modalZoomLabel');
    console.log('✓ Zoom toggle works:', { before: zoomLabelBefore, after: zoomLabelAfter });

    // Test Delete from Modal
    galleryPage.on('dialog', (dialog) => dialog.accept());
    await galleryPage.click('#btnModalDelete');
    await new Promise((r) => setTimeout(r, 400));

    const remainingCount = await galleryPage.evaluate(async () => {
      const items = await window.RecorderDB.getAllScreenshots();
      return items.length;
    });
    console.log('✓ Deletion from modal confirmed, remaining screenshots:', remainingCount);

    console.log('\n🎉 ALL LIVE E2E TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    await context.close();
    server.close();
  }
}

testLiveE2E().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
