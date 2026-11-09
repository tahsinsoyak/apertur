/**
 * Generates Chrome Web Store–compliant listing graphics for Apertur.
 *
 * Output (store-assets/chrome-web-store/):
 *   - screenshot-1..5-*.jpg   1280x800  (store screenshots, 24-bit, no alpha)
 *   - promo-small-440x280.jpg           (required small promo tile)
 *   - promo-marquee-1400x560.jpg        (optional marquee tile, used for featuring)
 *   - store-icon-128.png                (128x128 store icon)
 *
 * Usage:
 *   npm install            # installs playwright (devDependency)
 *   npx playwright install chromium
 *   npm run store:assets
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'store-assets');
const OUT_DIR = path.join(SRC_DIR, 'chrome-web-store');

const SCREENSHOTS = [
  'screenshot-popup-studio.png',
  'screenshot-live-recording.png',
  'screenshot-player-trimmer.png',
  'screenshot-area-snip.png',
  'screenshot-local-library.png'
];

function dataUrl(file) {
  const buf = fs.readFileSync(file);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const ICON = dataUrl(path.join(ROOT, 'icons', 'icon128.png'));

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow: hidden; -webkit-font-smoothing: antialiased; }
  body {
    font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    color: #fff;
    background:
      radial-gradient(circle at 12% 18%, rgba(225, 29, 72, 0.38), transparent 42%),
      radial-gradient(circle at 92% 92%, rgba(6, 182, 212, 0.22), transparent 40%),
      radial-gradient(circle at 60% 0%, rgba(245, 158, 11, 0.14), transparent 34%),
      #0b1220;
  }
  .dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 999px;
    font-weight: 700; letter-spacing: 0.02em;
  }
  .pill i { width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; }
  .accent { color: #fb7185; }
`;

const SMALL_TILE = `<!DOCTYPE html><html><head><style>${BASE_CSS}
  body { width: 440px; height: 280px; position: relative; }
  .wrap { position: relative; height: 100%; padding: 30px 30px; display: flex; flex-direction: column; justify-content: center; }
  .head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .head img { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 10px 30px rgba(225,29,72,0.45); }
  .name { font-size: 34px; font-weight: 900; letter-spacing: -0.03em; }
  h1 { font-size: 27px; line-height: 1.12; font-weight: 900; letter-spacing: -0.025em; margin-bottom: 16px; }
  .pill { font-size: 13px; padding: 6px 12px; }
</style></head><body><div class="dots"></div>
  <div class="wrap">
    <div class="head"><img src="${ICON}"><div class="name">Apertur</div></div>
    <h1>Free <span class="accent">60 FPS</span> Screen<br>Recorder &amp; Screenshots</h1>
    <div><span class="pill"><i></i>100% private &bull; No sign-up &bull; Open source</span></div>
  </div>
</body></html>`;

const MARQUEE = (shot) => `<!DOCTYPE html><html><head><style>${BASE_CSS}
  body { width: 1400px; height: 560px; position: relative; }
  .wrap { position: relative; height: 100%; display: grid; grid-template-columns: 620px 1fr; align-items: center; gap: 40px; padding: 0 0 0 80px; }
  /* Fade the screenshot's left edge into the background */
  .shot { mask-image: linear-gradient(90deg, transparent 0, #000 70px); -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 70px); }
  .head { display: flex; align-items: center; gap: 18px; margin-bottom: 26px; }
  .head img { width: 84px; height: 84px; border-radius: 20px; box-shadow: 0 14px 40px rgba(225,29,72,0.45); }
  .name { font-size: 46px; font-weight: 900; letter-spacing: -0.03em; }
  h1 { font-size: 56px; line-height: 1.05; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 22px; }
  p { font-size: 22px; line-height: 1.45; color: rgba(255,255,255,0.78); margin-bottom: 28px; max-width: 540px; }
  .pills { display: flex; gap: 10px; flex-wrap: wrap; }
  .pill { font-size: 16px; padding: 9px 16px; }
  .shot { height: 100%; position: relative; overflow: hidden; }
  /* Crop the source screenshot to its browser mockup (right ~45% of the image) */
  .shot img {
    position: absolute; top: -60px; left: -490px;
    width: 1152px;
  }
</style></head><body><div class="dots"></div>
  <div class="wrap">
    <div>
      <div class="head"><img src="${ICON}"><div class="name">Apertur</div></div>
      <h1>Record your screen in <span class="accent">1080p 60 FPS</span>.</h1>
      <p>Cursor spotlight, click ripples, built-in trimmer and lossless screenshots &mdash; stored only on your computer.</p>
      <div class="pills">
        <span class="pill"><i></i>Free forever</span>
        <span class="pill"><i></i>No account</span>
        <span class="pill"><i></i>No cloud uploads</span>
      </div>
    </div>
    <div class="shot"><img src="${shot}"></div>
  </div>
</body></html>`;

async function renderHtml(page, html, width, height, outFile) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width, height } });
  console.log(`  ✓ ${path.relative(ROOT, outFile)} (${width}x${height})`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  console.log('Generating Chrome Web Store assets...');

  // 1. Screenshots: downscale 2560x1600 sources to the 1280x800 store size
  for (let i = 0; i < SCREENSHOTS.length; i++) {
    const src = path.join(SRC_DIR, SCREENSHOTS[i]);
    if (!fs.existsSync(src)) {
      console.warn(`  ⚠ Missing ${SCREENSHOTS[i]}, skipping`);
      continue;
    }
    const name = SCREENSHOTS[i].replace(/^screenshot-/, '').replace(/\.png$/, '');
    const html = `<!DOCTYPE html><html><body style="margin:0;background:#0b1220">
      <img src="${dataUrl(src)}" style="display:block;width:1280px;height:800px;object-fit:cover"></body></html>`;
    await renderHtml(page, html, 1280, 800, path.join(OUT_DIR, `screenshot-${i + 1}-${name}.jpg`));
  }

  // 2. Promo tiles
  await renderHtml(page, SMALL_TILE, 440, 280, path.join(OUT_DIR, 'promo-small-440x280.jpg'));
  const marqueeShot = dataUrl(path.join(SRC_DIR, 'screenshot-live-recording.png'));
  await renderHtml(page, MARQUEE(marqueeShot), 1400, 560, path.join(OUT_DIR, 'promo-marquee-1400x560.jpg'));

  // 3. Store icon (128x128) — copied from the extension icon
  fs.copyFileSync(path.join(ROOT, 'icons', 'icon128.png'), path.join(OUT_DIR, 'store-icon-128.png'));
  console.log(`  ✓ ${path.relative(ROOT, path.join(OUT_DIR, 'store-icon-128.png'))} (128x128)`);

  await browser.close();
  console.log('\nDone. Upload these files in the Chrome Web Store Developer Dashboard → Store listing.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
