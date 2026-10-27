const fs = require('fs');
const assert = require('assert');

console.log('Testing Apertur Screenshot Suite...');

// 1. Verify manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
assert(manifest.permissions.includes('clipboardWrite'), 'clipboardWrite permission missing');
assert(manifest.commands.capture_visible, 'capture_visible command missing');
assert(manifest.commands.capture_selected, 'capture_selected command missing');
assert(manifest.commands.capture_full, 'capture_full command missing');
console.log('✓ Manifest commands and permissions verified');

// 2. Verify popup.html contains screenshot menu
const popupHtml = fs.readFileSync('popup/popup.html', 'utf8');
assert(popupHtml.includes('id="screenshotMenu"'), 'screenshotMenu missing in popup.html');
assert(popupHtml.includes('id="btnSnapVisible"'), 'btnSnapVisible missing in popup.html');
assert(popupHtml.includes('id="btnSnapArea"'), 'btnSnapArea missing in popup.html');
assert(popupHtml.includes('id="btnSnapFull"'), 'btnSnapFull missing in popup.html');
assert(popupHtml.includes('id="checkAutoCopyClipboard"'), 'checkAutoCopyClipboard missing in popup.html');
console.log('✓ popup.html screenshot menu markup verified');

// 3. Verify preview.html contains media filters and screenshot modal
const previewHtml = fs.readFileSync('preview/preview.html', 'utf8');
assert(previewHtml.includes('media-filter-bar'), 'media-filter-bar missing in preview.html');
assert(previewHtml.includes('imageViewerModal'), 'imageViewerModal missing in preview.html');
assert(previewHtml.includes('btnModalCopy'), 'btnModalCopy missing in preview.html');
assert(previewHtml.includes('btnModalDownload'), 'btnModalDownload missing in preview.html');
console.log('✓ preview.html gallery filters and viewer modal verified');

// 4. Verify content.js has all screenshot methods
const contentJs = fs.readFileSync('content/content.js', 'utf8');
assert(contentJs.includes('startAreaSnipping'), 'startAreaSnipping missing in content.js');
assert(contentJs.includes('startFullPageScreenshot'), 'startFullPageScreenshot missing in content.js');
assert(contentJs.includes('captureVisibleScreenshot'), 'captureVisibleScreenshot missing in content.js');
assert(contentJs.includes('showAperturToast'), 'showAperturToast missing in content.js');
assert(contentJs.includes('TRIGGER_VISIBLE_SCREENSHOT'), 'TRIGGER_VISIBLE_SCREENSHOT missing in content.js');
assert(contentJs.includes('START_AREA_SELECTION'), 'START_AREA_SELECTION missing in content.js');
assert(contentJs.includes('START_FULL_PAGE_SCREENSHOT'), 'START_FULL_PAGE_SCREENSHOT missing in content.js');
assert(contentJs.includes('__tr_btn_dock_snip__'), 'Dock snip button missing in content.js');
console.log('✓ content.js screenshot suite methods verified');

// 5. Verify background.js handles commands and messages
const bgJs = fs.readFileSync('background/background.js', 'utf8');
assert(bgJs.includes('SAVE_SCREENSHOT_TO_LIBRARY_REQUEST'), 'SAVE_SCREENSHOT_TO_LIBRARY_REQUEST missing in background.js');
assert(bgJs.includes('TRIGGER_AREA_SNIP_FROM_POPUP'), 'TRIGGER_AREA_SNIP_FROM_POPUP missing in background.js');
assert(bgJs.includes('TRIGGER_FULL_PAGE_FROM_POPUP'), 'TRIGGER_FULL_PAGE_FROM_POPUP missing in background.js');
assert(bgJs.includes('chrome.commands.onCommand.addListener'), 'chrome.commands listener missing in background.js');
console.log('✓ background.js message & command handlers verified');

// 6. Verify db.js functions
const dbJs = fs.readFileSync('utils/db.js', 'utf8');
assert(dbJs.includes('saveScreenshot'), 'saveScreenshot missing in db.js');
assert(dbJs.includes('getAllScreenshots'), 'getAllScreenshots missing in db.js');
assert(dbJs.includes('getAllVideos'), 'getAllVideos missing in db.js');
console.log('✓ db.js screenshot storage helpers verified');

// 7. Verify CSS styles
const contentCss = fs.readFileSync('content/content.css', 'utf8');
assert(contentCss.includes('#__apertur_snip_overlay__'), 'snip overlay CSS missing');
assert(contentCss.includes('#__apertur_snip_box__'), 'snip box CSS missing');
assert(contentCss.includes('.__apertur_toast__'), 'toast CSS missing');
assert(contentCss.includes('#__apertur_fullpage_progress__'), 'fullpage progress CSS missing');

const popupCss = fs.readFileSync('popup/popup.css', 'utf8');
assert(popupCss.includes('.screenshot-dropdown'), 'screenshot dropdown CSS missing');

const previewCss = fs.readFileSync('preview/preview.css', 'utf8');
assert(previewCss.includes('.media-filter-bar'), 'media-filter-bar CSS missing');
assert(previewCss.includes('.image-viewer-modal'), 'image-viewer-modal CSS missing');
console.log('✓ All CSS styles verified');

console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟\n');
