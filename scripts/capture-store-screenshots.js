/**
 * Generates 1280x800 Chrome Web Store & GitHub Showcase Screenshots for Apertur v2.0
 */
const fs = require('fs');
const path = require('path');

const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'store-assets');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function fileUrl(relPath) {
  return 'file:///' + path.join(ROOT, relPath).replace(/\\/g, '/');
}

const SHARED_FRAME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1280px !important;
    min-height: 800px !important;
    max-height: 800px !important;
    height: 800px !important;
    overflow: hidden !important;
    background: #0b1220 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    -webkit-font-smoothing: antialiased;
  }
  .store-canvas {
    position: relative;
    width: 1280px;
    height: 800px;
    display: grid;
    grid-template-columns: 460px minmax(0, 1fr);
    align-items: center;
    gap: 48px;
    padding: 56px 64px;
    background:
      radial-gradient(circle at 14% 16%, rgba(225, 29, 72, 0.20), transparent 36%),
      radial-gradient(circle at 86% 88%, rgba(6, 182, 212, 0.16), transparent 34%),
      radial-gradient(circle at 52% 12%, rgba(245, 158, 11, 0.12), transparent 28%),
      #0b1220;
    color: #ffffff;
  }
  .store-canvas::before {
    position: fixed;
    inset: 0;
    pointer-events: none;
    content: '';
    background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.07) 1px, transparent 0);
    background-size: 24px 24px;
    opacity: 0.75;
  }
  .store-story {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    margin-bottom: 22px;
  }
  .brand-badge img {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }
  .brand-badge span {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fda4af;
    text-transform: uppercase;
  }
  .story-kicker {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fda4af;
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .story-kicker span {
    width: 28px;
    height: 2px;
    background: #e11d48;
    border-radius: 10px;
  }
  .store-story h2 {
    margin: 16px 0 14px;
    font-size: 44px;
    line-height: 1.04;
    letter-spacing: -0.045em;
    font-weight: 850;
    color: #f8fafc;
  }
  .store-story > p {
    color: #cbd5e1;
    font-size: 15.5px;
    line-height: 1.62;
    letter-spacing: -0.01em;
  }
  .example-card {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 28px;
    padding: 18px 22px;
    color: #0f172a;
    background: #fffdf9;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 18px;
    box-shadow: 0 24px 55px -24px rgba(0, 0, 0, 0.75);
  }
  .example-card > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .example-label {
    color: #64748b;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .example-card strong {
    font-family: 'JetBrains Mono', monospace;
    font-size: 23px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #e11d48;
  }
  .example-detail {
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    max-width: 190px;
    line-height: 1.4;
  }
  .story-accent {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 18px;
    color: #6ee7b7;
    font-size: 12.5px;
    font-weight: 800;
  }
  .story-accent span {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    color: #0b1220;
    background: #34d399;
    border-radius: 50%;
    font-size: 12px;
  }
  .stage-column {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
`;

async function generateScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });

  const icon32Base64 = fs.readFileSync(path.join(ROOT, 'icons/icon32.png')).toString('base64');
  const icon32Url = `data:image/png;base64,${icon32Base64}`;
  const popupCss = fs.readFileSync(path.join(ROOT, 'popup/popup.css'), 'utf8');
  const popupBodyMatch = fs.readFileSync(path.join(ROOT, 'popup/popup.html'), 'utf8').match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const popupInner = (popupBodyMatch ? popupBodyMatch[1] : '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\.\.\/icons\/icon32\.png/g, icon32Url);

  // ---------------------------------------------------------------------------
  // 1. SCREENSHOT 1: POPUP STUDIO CONTROLLER
  // ---------------------------------------------------------------------------
  {
    const page = await context.newPage();
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${popupCss}</style>
      <style>${SHARED_FRAME_CSS}
        body {
          width: 1280px !important;
          max-height: 800px !important;
          height: 800px !important;
          background: #0b1220 !important;
        }
        .popup-showcase-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .popup-device-frame {
          width: 368px;
          background: #f8fafc;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 38px 90px rgba(0, 0, 0, 0.58), 0 0 0 8px rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #0f172a;
        }
        .popup-device-frame .brand-title {
          font-size: 15px !important;
        }
        .floating-callout {
          position: absolute;
          right: 6px;
          top: 36px;
          background: rgba(15, 23, 42, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          color: #f8fafc;
          width: 155px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.45);
        }
        .floating-callout strong {
          display: block;
          font-size: 11px;
          color: #fda4af;
          margin-bottom: 4px;
        }
        .floating-callout span {
          font-size: 10.5px;
          color: #cbd5e1;
          line-height: 1.4;
          display: block;
        }
        .floating-callout-bottom {
          position: absolute;
          right: 6px;
          bottom: 42px;
          background: rgba(15, 23, 42, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          color: #f8fafc;
          width: 155px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.45);
        }
        .floating-callout-bottom strong {
          display: block;
          font-size: 11px;
          color: #fcd34d;
          margin-bottom: 4px;
        }
        .floating-callout-bottom span {
          font-size: 10.5px;
          color: #cbd5e1;
          line-height: 1.4;
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="store-canvas">
        <aside class="store-story">
          <div class="brand-badge">
            <img src="${icon32Url}" alt="Apertur">
            <span>Apertur v2.0 • Daylight Studio</span>
          </div>
          <div class="story-kicker"><span></span>REDIRECT-SAFE CAPTURE</div>
          <h2>Record full browser workflows in 60 FPS.</h2>
          <p>Capture your Browser Window, Entire Screen, or Current Tab with studio audio mixing, a 3-second countdown, and instant PNG snapshots.</p>
          <div class="example-card">
            <div>
              <span class="example-label">Master Encoding</span>
              <strong>1080p • 60 FPS</strong>
            </div>
            <span class="example-detail">12 Mbps VP9 Video<br>192 kbps Mixed Audio</span>
          </div>
          <div class="story-accent"><span>✓</span>Survives logins, OAuth &amp; page redirects</div>
        </aside>
        <div class="stage-column" style="justify-content:flex-start;padding-left:20px;">
          <div class="popup-showcase-wrap" style="justify-content:flex-start;">
            <div class="popup-device-frame">
              ${popupInner}
            </div>
            <div class="floating-callout">
              <strong>📸 1-Click Tab PNG</strong>
              <span>Snap lossless screenshots right from the header bar.</span>
            </div>
            <div class="floating-callout-bottom">
              <strong>⏱️ 3s Pre-Roll + 5 Colors</strong>
              <span>Countdown overlay &amp; 60Hz cursor spotlight themes.</span>
            </div>
          </div>
        </div>
      </div>
      <script>
        const badge = document.getElementById('libraryCountBadge');
        if (badge) { badge.textContent = '3'; badge.classList.remove('hidden'); }
        const mic = document.getElementById('checkMicrophone');
        if (mic) mic.checked = true;
      </script>
    </body>
    </html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot-popup-studio.png') });
    await page.close();
    console.log('✓ Captured store-assets/screenshot-popup-studio.png');
  }

  // ---------------------------------------------------------------------------
  // 2. SCREENSHOT 2: LIVE RECORDING HUD, COUNTDOWN & CURSOR SPOTLIGHT
  // ---------------------------------------------------------------------------
  {
    const page = await context.newPage();
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${SHARED_FRAME_CSS}
        .browser-window-mockup {
          width: 660px;
          height: 560px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 38px 90px rgba(0, 0, 0, 0.58), 0 0 0 8px rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          position: relative;
          color: #0f172a;
        }
        .browser-chrome-bar {
          height: 44px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
        }
        .dots { display: flex; gap: 6px; }
        .dots span { width: 10px; height: 10px; border-radius: 50%; }
        .dots span:nth-child(1) { background: #fb7185; }
        .dots span:nth-child(2) { background: #fbbf24; }
        .dots span:nth-child(3) { background: #34d399; }
        .address-pill {
          flex: 1;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rec-badge-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: 99px;
          background: #ffe4e6;
          color: #e11d48;
          font-size: 10.5px;
          font-weight: 800;
        }
        .rec-badge-live i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e11d48;
        }
        .app-stage {
          flex: 1;
          padding: 28px;
          background:
            radial-gradient(circle at 62% 48%, rgba(245, 158, 11, 0.08), transparent 45%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .app-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .app-header-row h3 {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        }
        .kpi-card span { font-size: 11px; color: #64748b; font-weight: 600; }
        .kpi-card strong { display: block; font-size: 20px; font-weight: 800; margin-top: 4px; color: #0f172a; }
        .action-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
          margin-top: 4px;
        }
        .cta-btn-simulated {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 700;
          position: relative;
        }
        .cursor-spotlight-demo {
          position: absolute;
          left: 492px;
          top: 236px;
          width: 58px;
          height: 58px;
          margin-left: -29px;
          margin-top: -29px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.24);
          border: 2.5px solid #f59e0b;
          box-shadow: 0 0 28px rgba(245, 158, 11, 0.55);
          z-index: 20;
        }
        .cursor-ripple-ring {
          position: absolute;
          left: 492px;
          top: 236px;
          width: 96px;
          height: 96px;
          margin-left: -48px;
          margin-top: -48px;
          border-radius: 50%;
          border: 2px solid rgba(245, 158, 11, 0.55);
          z-index: 19;
        }
        .cursor-pointer-svg {
          position: absolute;
          left: 488px;
          top: 232px;
          z-index: 25;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
        }
        .countdown-preview-card {
          position: absolute;
          left: 28px;
          bottom: 92px;
          background: rgba(15, 23, 42, 0.9);
          color: #ffffff;
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.25);
        }
        .countdown-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e11d48, #f43f5e);
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 18px;
        }
        .porcelain-hud {
          position: absolute;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          box-shadow: 0 16px 38px rgba(15, 23, 42, 0.18);
          z-index: 30;
          white-space: nowrap;
        }
        .hud-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #e11d48;
          box-shadow: 0 0 8px #e11d48;
        }
        .hud-timer {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .hud-div { width: 1px; height: 16px; background: #e2e8f0; }
        .hud-btn {
          padding: 5px 11px;
          border-radius: 99px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          font-size: 11.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .hud-btn.active-fx {
          background: #fffbeb;
          border-color: #f59e0b;
          color: #b45309;
        }
        .hud-finish {
          padding: 5px 13px;
          border-radius: 99px;
          background: #e11d48;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="store-canvas">
        <aside class="store-story">
          <div class="brand-badge">
            <img src="${icon32Url}" alt="Apertur">
            <span>Real-Time Visual Helpers</span>
          </div>
          <div class="story-kicker"><span></span>60HZ CURSOR &amp; LIVE HUD</div>
          <h2>Spotlight every click automatically.</h2>
          <p>Guide viewers with a smooth 60Hz glowing cursor halo, click shockwave ripples in 5 colors, a 3, 2, 1 pre-roll countdown, and an in-page control bar.</p>
          <div class="example-card">
            <div>
              <span class="example-label">Visual Telemetry</span>
              <strong>60Hz Cursor FX</strong>
            </div>
            <span class="example-detail">5 Studio Color Themes<br>Live Pause &amp; PNG Snap</span>
          </div>
          <div class="story-accent"><span>✓</span>Control bar stays visible across page loads</div>
        </aside>
        <div class="stage-column">
          <div class="browser-window-mockup">
            <div class="browser-chrome-bar">
              <div class="dots"><span></span><span></span><span></span></div>
              <div class="address-pill">
                <span>https://app.example.com/checkout/confirm</span>
                <span class="rec-badge-live"><i></i> REC 1080p60</span>
              </div>
            </div>
            <div class="app-stage">
              <div class="app-header-row">
                <h3>Production Release Dashboard</h3>
                <span style="font-size:12px;font-weight:700;color:#10b981;background:#ecfdf5;padding:4px 10px;border-radius:99px;">● All Checks Passing</span>
              </div>
              <div class="kpi-row">
                <div class="kpi-card"><span>Frame Rate</span><strong>60.0 FPS</strong></div>
                <div class="kpi-card"><span>Video Bitrate</span><strong>12.0 Mbps</strong></div>
                <div class="kpi-card"><span>Audio Stream</span><strong>192 kbps</strong></div>
              </div>
              <div class="action-panel">
                <div>
                  <strong style="font-size:14px;display:block;margin-bottom:3px;">Deploy OAuth Workflow</strong>
                  <span style="font-size:12px;color:#64748b;">Click button to trigger multi-page redirect</span>
                </div>
                <div class="cta-btn-simulated">Confirm &amp; Continue →</div>
              </div>

              <div class="cursor-ripple-ring"></div>
              <div class="cursor-spotlight-demo"></div>
              <svg class="cursor-pointer-svg" width="26" height="26" viewBox="0 0 24 24" fill="#0f172a" stroke="#ffffff" stroke-width="1.8">
                <path d="M4 3l16 7-7 2-2 7-7-16z"/>
              </svg>

              <div class="countdown-preview-card">
                <div class="countdown-circle">3</div>
                <div>
                  <strong style="font-size:12px;display:block;">3, 2, 1 Countdown Overlay</strong>
                  <span style="font-size:11px;color:#cbd5e1;">Get your mouse ready before capture starts</span>
                </div>
              </div>

              <div class="porcelain-hud">
                <span class="hud-dot"></span>
                <span class="hud-timer">00:24</span>
                <span class="hud-div"></span>
                <span class="hud-btn">Pause</span>
                <span class="hud-btn active-fx">✦ FX: Amber</span>
                <span class="hud-btn">📸 Snap PNG</span>
                <span class="hud-finish">■ Finish</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot-live-recording.png') });
    await page.close();
    console.log('✓ Captured store-assets/screenshot-live-recording.png');
  }

  // ---------------------------------------------------------------------------
  // 3. SCREENSHOT 3: VIDEO PLAYER STUDIO, TRIM BAR & CLICK-TO-RENAME
  // ---------------------------------------------------------------------------
  {
    const page = await context.newPage();
    const previewCss = fs.readFileSync(path.join(ROOT, 'preview/preview.css'), 'utf8');
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${previewCss}</style>
      <style>${SHARED_FRAME_CSS}
        .studio-window-card {
          width: 670px;
          background: #f8fafc;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 38px 90px rgba(0, 0, 0, 0.58), 0 0 0 8px rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #0f172a;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .studio-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .rename-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #e11d48;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12);
          padding: 5px 12px;
          border-radius: 10px;
        }
        .rename-title-box h3 {
          font-size: 14.5px;
          font-weight: 800;
          color: #0f172a;
        }
        .rename-pill {
          font-size: 10px;
          font-weight: 800;
          color: #e11d48;
          background: #ffe4e6;
          padding: 2px 7px;
          border-radius: 99px;
          text-transform: uppercase;
        }
        .video-stage-preview {
          height: 295px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbd5e1;
        }
        .simulated-video-content {
          width: 86%;
          height: 80%;
          background: #ffffff;
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .play-overlay-badge {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.18);
        }
        .play-circle {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.95);
          color: #ffffff;
          display: grid;
          place-items: center;
          box-shadow: 0 12px 28px rgba(225, 29, 72, 0.45);
        }
        .studio-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
        }
        .meta-chips {
          display: flex;
          gap: 6px;
        }
        .meta-chip {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #334155;
        }
        .btn-group-demo {
          display: flex;
          gap: 8px;
        }
        .btn-frame-png {
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .btn-dl-webm {
          padding: 7px 14px;
          border-radius: 8px;
          background: #e11d48;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="store-canvas">
        <aside class="store-story">
          <div class="brand-badge">
            <img src="${icon32Url}" alt="Apertur">
            <span>Built-In Post-Production</span>
          </div>
          <div class="story-kicker"><span></span>TRIM, RENAME &amp; SNAPSHOT</div>
          <h2>Edit and export right in your browser.</h2>
          <p>Cut out the first or last seconds with interactive Start and End sliders, click any title to rename your file, export exact video frames as PNGs, or download WebM clips.</p>
          <div class="example-card">
            <div>
              <span class="example-label">Built-In Video Studio</span>
              <strong>0.1s Trim Sliders</strong>
            </div>
            <span class="example-detail">Click-to-Rename Title<br>Frame PNG + WebM Export</span>
          </div>
          <div class="story-accent"><span>✓</span>Saves trimmed copies directly to IndexedDB</div>
        </aside>
        <div class="stage-column">
          <div class="studio-window-card">
            <div class="studio-top-bar">
              <div class="rename-title-box">
                <h3>OAuth Login &amp; Checkout Walkthrough</h3>
                <span class="rename-pill">✎ Click to Rename</span>
              </div>
              <span style="font-size:11.5px;font-weight:700;color:#64748b;">Saved in Local DB</span>
            </div>

            <div class="video-stage-preview">
              <div class="simulated-video-content">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="font-size:13px;color:#0f172a;">Checkout Flow Recording • 1920×1080</strong>
                  <span style="font-size:11px;font-weight:700;color:#e11d48;background:#ffe4e6;padding:2px 8px;border-radius:99px;">60.0 FPS VP9</span>
                </div>
                <div style="height:110px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:600;">
                  Cursor Spotlight + Mixed Audio Stream Active
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#475569;">
                  <span>00:02.4 / 00:18.6</span>
                  <span>1.25× Speed • HD</span>
                </div>
                <div class="play-overlay-badge">
                  <div class="play-circle">▶</div>
                </div>
              </div>
            </div>

            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#0f172a;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.2">
                    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
                  </svg>
                  Trim Video Start / End
                </span>
                <span style="font-size:11.5px;color:#e11d48;font-weight:800;background:#ffe4e6;padding:2px 8px;border-radius:99px;">Selected 00:02.4 to 00:16.0 (13.6s)</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr auto;align-items:center;gap:14px;">
                <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:#475569;">
                  <span>Start: <strong style="color:#0f172a;font-family:'JetBrains Mono',monospace;">00:02.4</strong></span>
                  <input type="range" min="0" max="100" value="14" style="accent-color:#e11d48;width:100%;" />
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:#475569;">
                  <span>End: <strong style="color:#0f172a;font-family:'JetBrains Mono',monospace;">00:16.0</strong></span>
                  <input type="range" min="0" max="100" value="86" style="accent-color:#e11d48;width:100%;" />
                </label>
                <div style="display:flex;gap:6px;">
                  <span style="padding:7px 11px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;font-size:11px;font-weight:700;color:#0f172a;">Preview</span>
                  <span style="padding:7px 12px;border-radius:8px;background:#0f172a;color:#ffffff;font-size:11px;font-weight:700;">✂ Save Trimmed Copy</span>
                </div>
              </div>
            </div>

            <div class="studio-actions-bar">
              <div class="meta-chips">
                <span class="meta-chip">1920×1080</span>
                <span class="meta-chip">60 FPS</span>
                <span class="meta-chip">14.2 MB WebM</span>
              </div>
              <div class="btn-group-demo">
                <span class="btn-frame-png">📸 Frame PNG</span>
                <span class="btn-dl-webm">⬇ Download .webm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot-player-trimmer.png') });
    await page.close();
    console.log('✓ Captured store-assets/screenshot-player-trimmer.png');
  }

  // ---------------------------------------------------------------------------
  // 4. SCREENSHOT 4: AREA SNIPPING & FULL WEBPAGE CAPTURE SUITE
  // ---------------------------------------------------------------------------
  {
    const page = await context.newPage();
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${SHARED_FRAME_CSS}
        .browser-mock-window {
          width: 670px;
          height: 480px;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 38px 90px rgba(0, 0, 0, 0.58), 0 0 0 8px rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .bm-topbar {
          height: 38px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 12px;
        }
        .bm-dots {
          display: flex;
          gap: 6px;
        }
        .bm-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .bm-dots span:nth-child(1) { background: #ef4444; }
        .bm-dots span:nth-child(2) { background: #f59e0b; }
        .bm-dots span:nth-child(3) { background: #10b981; }
        .bm-url {
          flex: 1;
          height: 24px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #475569;
        }
        .bm-body {
          flex: 1;
          padding: 24px;
          background: #f8fafc;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .mock-hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mock-hero h3 { font-size: 18px; font-weight: 800; color: #0f172a; }
        .mock-hero p { font-size: 13px; color: #64748b; line-height: 1.5; }
        .mock-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .mock-col {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          height: 90px;
        }

        /* Snip Overlay Emulation */
        .snip-overlay-mock {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.44);
          backdrop-filter: blur(1.5px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .snip-banner-mock {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #f8fafc;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .snip-banner-mock kbd {
          background: #334155;
          color: #f8fafc;
          padding: 1px 5px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 10px;
        }
        .snip-box-mock {
          position: absolute;
          top: 70px;
          left: 45px;
          width: 580px;
          height: 250px;
          border: 2px solid #f59e0b;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.42);
          pointer-events: none;
        }
        .snip-dims-mock {
          position: absolute;
          top: -24px;
          left: 0;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .snip-toolbar-mock {
          position: absolute;
          bottom: -46px;
          right: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          padding: 5px 8px;
          border-radius: 10px;
          box-shadow: 0 16px 36px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .snip-tb-btn {
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .snip-tb-btn.primary {
          background: #e11d48;
          color: #ffffff;
        }
        .snip-tb-btn.secondary {
          background: #1e293b;
          color: #f1f5f9;
        }
        .mock-toast {
          position: absolute;
          bottom: 14px;
          right: 14px;
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.15);
          color: #34d399;
        }
      </style>
    </head>
    <body>
      <div class="store-canvas">
        <aside class="store-story">
          <div class="brand-badge">
            <img src="${icon32Url}" alt="Apertur">
            <span>Precision Area Snipping</span>
          </div>
          <div class="story-kicker"><span></span>LOSSLESS SCREENSHOT SUITE</div>
          <h2>Snip any region with pixel precision.</h2>
          <p>Drag to crop custom areas with real-time dimension readout. Copy directly to clipboard, download as PNG, or save to your local library.</p>
          <div class="example-card">
            <div>
              <span class="example-label">Keyboard Shortcuts</span>
              <strong>Alt + Shift + A</strong>
            </div>
            <span class="example-detail">Full Page: Alt+Shift+F<br>Visible: Alt+Shift+V</span>
          </div>
          <div class="story-accent"><span>✓</span>Direct clipboard copy &amp; full-page scrolling capture</div>
        </aside>
        <div class="stage-column">
          <div class="browser-mock-window">
            <div class="bm-topbar">
              <div class="bm-dots"><span></span><span></span><span></span></div>
              <div class="bm-url">https://company-dashboard.internal/analytics</div>
            </div>
            <div class="bm-body">
              <div class="mock-hero">
                <h3>Quarterly Performance &amp; Revenue Metrics</h3>
                <p>Real-time analytics and user acquisition pipeline across all web platforms.</p>
              </div>
              <div class="mock-grid">
                <div class="mock-col"></div>
                <div class="mock-col"></div>
                <div class="mock-col"></div>
              </div>

              <!-- Snip Overlay -->
              <div class="snip-overlay-mock">
                <div class="snip-banner-mock">
                  <span>✂️ Click &amp; drag to crop an area • Press <kbd>Esc</kbd> to cancel</span>
                </div>
                <div class="snip-box-mock">
                  <div class="snip-dims-mock">840 × 440 px</div>
                  <div class="snip-toolbar-mock">
                    <span class="snip-tb-btn primary">📋 Copy</span>
                    <span class="snip-tb-btn secondary">⬇ Save PNG</span>
                    <span class="snip-tb-btn secondary">🗄 Library</span>
                  </div>
                </div>
                <div class="mock-toast">✓ Snip copied to clipboard &amp; saved!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot-area-snip.png') });
    await page.close();
    console.log('✓ Captured store-assets/screenshot-area-snip.png');
  }

  // ---------------------------------------------------------------------------
  // 5. SCREENSHOT 5: 100% PRIVATE LOCAL MEDIA LIBRARY & ZOOM VIEWER
  // ---------------------------------------------------------------------------
  {
    const page = await context.newPage();
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${SHARED_FRAME_CSS}
        .library-window-card {
          width: 670px;
          background: #f8fafc;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 38px 90px rgba(0, 0, 0, 0.58), 0 0 0 8px rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #0f172a;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lib-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .lib-header h3 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }
        .lib-header p {
          font-size: 11.5px;
          color: #64748b;
          margin-top: 2px;
        }
        .filter-pills {
          display: flex;
          gap: 6px;
        }
        .fpill {
          padding: 4px 11px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
        }
        .fpill.active {
          background: #e11d48;
          border-color: #e11d48;
          color: #ffffff;
        }
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rec-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 12px;
          display: grid;
          grid-template-columns: 120px 1fr auto;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        }
        .rec-thumb {
          height: 64px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
        }
        .rec-thumb.snap {
          background: linear-gradient(135deg, #047857, #065f46);
        }
        .rec-thumb span {
          position: absolute;
          bottom: 4px;
          right: 5px;
          background: rgba(0,0,0,0.75);
          padding: 1px 5px;
          border-radius: 3px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
        }
        .rec-info h4 {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .rec-tags {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .rec-tags span {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
        }
        .rec-tags span.highlight {
          background: #ffe4e6;
          color: #e11d48;
        }
        .rec-tags span.snap-tag {
          background: #ecfdf5;
          color: #047857;
        }
        .rec-btns {
          display: flex;
          gap: 5px;
        }
        .btn-watch {
          padding: 6px 10px;
          border-radius: 6px;
          background: #0f172a;
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 700;
        }
        .btn-dl {
          padding: 6px 9px;
          border-radius: 6px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-size: 10.5px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="store-canvas">
        <aside class="store-story">
          <div class="brand-badge">
            <img src="${icon32Url}" alt="Apertur">
            <span>Zero Cloud Uploads</span>
          </div>
          <div class="story-kicker"><span></span>100% LOCAL MEDIA VAULT</div>
          <h2>All your videos &amp; screenshots, offline.</h2>
          <p>No accounts, no watermarks, and zero cloud uploads. Browse recordings and lossless screenshots with 100% zoom inspection, instant clipboard copy, and WebM export.</p>
          <div class="example-card">
            <div>
              <span class="example-label">Privacy Architecture</span>
              <strong>100% Local DB</strong>
            </div>
            <span class="example-detail">Videos &amp; Screenshots<br>Zero Monthly Subscriptions</span>
          </div>
          <div class="story-accent"><span>✓</span>Filter by media type &amp; inspect at 100% zoom</div>
        </aside>
        <div class="stage-column">
          <div class="library-window-card">
            <div class="lib-header">
              <div>
                <h3>My Media Library (7)</h3>
                <p>Stored privately inside your browser's local IndexedDB</p>
              </div>
              <div class="filter-pills">
                <span class="fpill active">All Media</span>
                <span class="fpill">Videos (3)</span>
                <span class="fpill">Screenshots (4)</span>
              </div>
            </div>
            <div class="cards-list">
              <div class="rec-item-card">
                <div class="rec-thumb snap">📸 CROP<span>840×440</span></div>
                <div class="rec-info">
                  <h4>Analytics Dashboard Key Metrics (Crop)</h4>
                  <div class="rec-tags">
                    <span class="snap-tag">Screenshot</span>
                    <span>840 × 440 px</span>
                    <span>Lossless PNG</span>
                  </div>
                </div>
                <div class="rec-btns">
                  <span class="btn-watch">Inspect</span>
                  <span class="btn-dl">📋 Copy</span>
                </div>
              </div>

              <div class="rec-item-card">
                <div class="rec-thumb">▶ VIDEO<span>01:42</span></div>
                <div class="rec-info">
                  <h4>OAuth Login &amp; Checkout Walkthrough</h4>
                  <div class="rec-tags">
                    <span class="highlight">1920×1080 • 60 FPS</span>
                    <span>Browser Window</span>
                    <span>24.8 MB</span>
                  </div>
                </div>
                <div class="rec-btns">
                  <span class="btn-watch">Watch &amp; Trim</span>
                  <span class="btn-dl">⬇ .webm</span>
                </div>
              </div>

              <div class="rec-item-card">
                <div class="rec-thumb snap">📸 FULL<span>1280×2880</span></div>
                <div class="rec-info">
                  <h4>Full Product Landing Page (Scrolling)</h4>
                  <div class="rec-tags">
                    <span class="snap-tag">Full Page</span>
                    <span>1280 × 2880 px</span>
                    <span>Lossless PNG</span>
                  </div>
                </div>
                <div class="rec-btns">
                  <span class="btn-watch">Inspect</span>
                  <span class="btn-dl">⬇ .png</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot-local-library.png') });
    await page.close();
    console.log('✓ Captured store-assets/screenshot-local-library.png');
  }

  await browser.close();
  console.log('✨ All 5 store & GitHub showcase screenshots generated in store-assets/');
}

generateScreenshots().catch((err) => {
  console.error(err);
  process.exit(1);
});
