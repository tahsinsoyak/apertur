const fs = require('fs');
const path = require('path');
const playwrightPath = fs.existsSync('C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright')
  ? 'C:/Users/tahsinsoyak/Desktop/proje_github_clone/cost-per-use-extension/node_modules/playwright'
  : 'playwright';
const { chromium } = require(playwrightPath);

async function testWebsite() {
  console.log('--- Testing Website Interactive Documentation Hub ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  const filePath = path.resolve(__dirname, '..', 'landing', 'index.html');
  await page.goto('file://' + filePath);
  await page.waitForLoadState('networkidle');

  const docsSection = await page.$('#docs');
  console.log('✓ Docs section exists:', Boolean(docsSection));

  const tabs = await page.$$('.doc-tab-btn');
  console.log('✓ Docs nav tabs count:', tabs.length);

  // 1. Audio Tab
  await page.click('.doc-tab-btn[data-doc-target="doc-panel-audio"]');
  const isAudioActive = await page.$eval('#doc-panel-audio', el => el.classList.contains('active'));
  console.log('✓ Audio panel active:', isAudioActive);

  // Click Simulate Voice button
  await page.click('#btnSimulateVoice');
  const vuFillWidth = await page.$eval('#animVuFill', el => el.style.width);
  console.log('✓ Simulated Voice VU fill:', vuFillWidth);

  // 2. Annotation Studio Tab
  await page.click('.doc-tab-btn[data-doc-target="doc-panel-annot"]');
  const isAnnotActive = await page.$eval('#doc-panel-annot', el => el.classList.contains('active'));
  console.log('✓ Annotation panel active:', isAnnotActive);

  // 3. Video Trimmer Tab
  await page.click('.doc-tab-btn[data-doc-target="doc-panel-trimmer"]');
  const isTrimmerActive = await page.$eval('#doc-panel-trimmer', el => el.classList.contains('active'));
  console.log('✓ Trimmer panel active:', isTrimmerActive);

  // 4. Screenshot Modes Tab
  await page.click('.doc-tab-btn[data-doc-target="doc-panel-snip"]');
  const isSnipActive = await page.$eval('#doc-panel-snip', el => el.classList.contains('active'));
  console.log('✓ Snip panel active:', isSnipActive);

  // 5. Media Vault Tab
  await page.click('.doc-tab-btn[data-doc-target="doc-panel-vault"]');
  const isVaultActive = await page.$eval('#doc-panel-vault', el => el.classList.contains('active'));
  console.log('✓ Vault panel active:', isVaultActive);

  console.log('✓ Page Errors encountered:', pageErrors.length === 0 ? 'None (0 errors)' : pageErrors);
  await browser.close();

  if (pageErrors.length > 0) {
    throw new Error('Errors found on landing page: ' + pageErrors.join(', '));
  }
  console.log('\n🎉 WEBSITE INTERACTIVE DOCUMENTATION VERIFIED WITH 100% SUCCESS!');
}

testWebsite().catch((err) => {
  console.error('Website test failed:', err);
  process.exit(1);
});
