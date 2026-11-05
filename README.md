<div align="center">
  <img src="icons/icon128.png" alt="Apertur Logo" width="96" height="96" />
  <h1>Apertur</h1>
  <p><strong>Free, Open-Source 1080p 60 FPS Screen Recorder &amp; Lossless Screenshot Suite for Chrome</strong></p>

  <p>
    <a href="https://github.com/tahsinsoyak/apertur/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="MIT License" /></a>
    &nbsp;
    <a href="manifest.json"><img src="https://img.shields.io/badge/Manifest-V3-0284c7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3" /></a>
    &nbsp;
    <a href="https://www.patreon.com/tahsinsoyak"><img src="https://img.shields.io/badge/Patreon-Support%20Creator-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Support on Patreon" /></a>
    &nbsp;
    <a href="https://github.com/tahsinsoyak/apertur/releases/latest"><img src="https://img.shields.io/badge/Release-v2.0.0-8b5cf6?style=for-the-badge" alt="Latest Release" /></a>
  </p>

  <p>
    <a href="https://tahsinsoyak.github.io/apertur/"><strong>🌐 Live Interactive Demo &amp; Landing Page</strong></a>
    &nbsp;•&nbsp;
    <a href="https://github.com/tahsinsoyak/apertur/releases/latest"><strong>📦 Download Extension v2.0 (.zip)</strong></a>
    &nbsp;•&nbsp;
    <a href="https://tahsinsoyak.github.io/apertur/sponsor.html"><strong>💖 Sponsor &amp; Patreon</strong></a>
    &nbsp;•&nbsp;
    <a href="SPONSORS.md"><strong>🌟 Backer Tiers</strong></a>
    &nbsp;•&nbsp;
    <a href="https://github.com/tahsinsoyak/apertur/issues"><strong>🐛 Report Issue</strong></a>
  </p>
</div>

---

## 📸 Visual Showcase

<div align="center">
  <img src="store-assets/screenshot-popup-studio.png" alt="Apertur Daylight Studio Popup Controller" width="100%" />
</div>

<br/>

<table align="center" width="100%">
  <tr>
    <td width="50%">
      <img src="store-assets/screenshot-live-recording.png" alt="Live 60 FPS Recording + Floating HUD" width="100%" />
      <p align="center"><strong>Live 60 FPS Recording + Floating HUD &amp; Cursor Spotlight</strong></p>
    </td>
    <td width="50%">
      <img src="store-assets/screenshot-area-snip.png" alt="Precision Area Snipping Suite" width="100%" />
      <p align="center"><strong>Precision Area Crop (<kbd>Alt+Shift+A</kbd>) with Live Dimensions</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="store-assets/screenshot-player-trimmer.png" alt="Video Player Studio &amp; Trim Sliders" width="100%" />
      <p align="center"><strong>Video Player Studio with Start/End Trim Sliders &amp; Rename</strong></p>
    </td>
    <td width="50%">
      <img src="store-assets/screenshot-local-library.png" alt="100% Private Offline Media Vault" width="100%" />
      <p align="center"><strong>Unified Media Library (Videos &amp; Screenshots) + 100% Zoom Viewer</strong></p>
    </td>
  </tr>
</table>

---

## ✨ Why Apertur?

Most screen recorders force you to choose between **expensive cloud subscriptions ($15 to $29/month)** that upload your private recordings to third-party servers, or **fragile browser tab extensions** that drop the recording or lose their control bar the moment a website redirects or opens an OAuth login page.

**Apertur** is engineered on **Chrome Manifest V3 Offscreen Documents** with a precision **Daylight Studio** interface:

- **🛡️ Redirect-Safe Window &amp; Screen Capture**: Survives multi-page logins, OAuth redirects, and full-app workflows. Your floating recording HUD and cursor spotlight automatically re-attach after every navigation.
- **🎬 1080p 60 FPS VP9 Master Engine**: Hardware-accelerated WebM video encoding up to **12 Mbps** (`video/webm;codecs=vp9,opus`) paired with **192 kbps** studio-mixed system and microphone audio.
- **🎯 60Hz Cursor Spotlight &amp; Click Physics**: GPU-composited cursor halo and expanding click shockwave ripples in 5 studio color themes (`Amber`, `Blue`, `Purple`, `Red`, `Green`).
- **⏱️ Optional 3-Second Countdown Overlay (3, 2, 1)**: Full-screen animated countdown right after selecting your window, screen, or tab so your mouse is positioned before recording begins.
- **✂️ Built-In Video Trim Studio**: Interactive **Start** and **End** range sliders in the Video Player Studio let you preview a trimmed segment and save a clean trimmed `.webm` copy directly to your local library.
- **✏️ Click-to-Rename Video Titles**: Click any recording title or the pencil icon in the player to rename it inline. Custom titles persist in IndexedDB and name your downloaded files automatically.
- **📸 Lossless Screenshot Suite (3 Modes)**:
  • **Area Crop (<kbd>Alt+Shift+A</kbd>)**: Drag to crop any rectangle with live pixel dimension HUD and floating action toolbar (`Copy`, `Save PNG`, `Library`).
  • **Full Webpage Scrolling (<kbd>Alt+Shift+F</kbd>)**: Automatically scrolls and stitches the entire webpage into one crystal-clear PNG.
  • **Visible Viewport (<kbd>Alt+Shift+V</kbd>)**: Instant 1-click snapshot of the current view.
- **🗄️ 100% Private Media Vault with 100% Zoom Viewer**: Filter videos and screenshots with category pills, watch WebMs with hover previews, and inspect tall screenshots at native 100% full-resolution.
- **🔒 100% Local &amp; Free**: Zero cloud uploads, zero telemetry, zero watermarks, and no 5-minute time caps. Everything stays on your machine inside IndexedDB (`RecorderDB`).

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> | **Area Crop (Snip)** | Click &amp; drag to crop any region with live dimensions and floating toolbar |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | **Full Webpage** | Automatically scrolls and stitches the entire full page into a lossless PNG |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Visible Area** | 1-click capture of the currently visible viewport |

---

## 🚀 Installation & Quick Start

### Option A: Instant Release Download (No Terminal Required)
1. Download **[`apertur-v2.0.0-chrome-extension.zip`](https://github.com/tahsinsoyak/apertur/releases/latest)** from the latest GitHub Release and extract the ZIP.
2. Open Chrome (or Brave, Edge, Arc) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** and select the extracted folder.

### Option B: Build from Source
```bash
# 1. Clone repository
git clone https://github.com/tahsinsoyak/apertur.git
cd apertur

# 2. Build production package into dist/
node build.js
```
Then open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the generated **`dist/`** directory.

---

## 🛠️ Complete Feature Breakdown

### 1. Three Recording Modes
| Mode | Best For | Survives Page Redirects? | Audio Support |
| :--- | :--- | :--- | :--- |
| **Browser Window (`Recommended`)** | Multi-page workflows, SaaS testing, OAuth logins | ✅ **Yes (100% Continuous)** | System/Tab Audio + Mic |
| **Entire Screen** | Multi-window demos, IDE + terminal + browser workflows | ✅ **Yes (100% Continuous)** | System Audio + Mic |
| **This Tab Only (`1-Click`)** | Quick single-page clips without a picker dialog | ⚠️ Stops if tab navigates | Tab Audio (Unmuted) + Mic |

### 2. Live In-Page Floating HUD &amp; Cursor FX
- **Draggable Floating Bar**: Shows recording status, `MM:SS` timer, **Snap** (PNG), **Snip** (Area crop), **Pause/Resume**, and **Finish**.
- **5 Studio Highlight Colors**: Switch between `Amber (#f59e0b)`, `Blue (#06b6d4)`, `Purple (#8b5cf6)`, `Red (#e11d48)`, and `Green (#10b981)`.
- **3-Second Countdown**: Optional 3, 2, 1 pre-roll overlay so you can position your cursor before recording starts.

### 3. Video Player Studio &amp; Trimmer (`preview/preview.html`)
- **Theater Player**: Fitted viewport layout with speed switcher (`1x`, `1.25x`, `1.5x`, `2x`).
- **Precision Trimmer**: Drag **Start** and **End** range sliders (`0.1s` precision) to preview and save trimmed clips.
- **Frame PNG Extractor**: Click **Frame PNG** to export the exact current video frame at native resolution.

### 4. Lossless Screenshot Suite &amp; Media Vault
- **Area Snipping**: Active pixel crosshairs and floating toolbar to Copy to clipboard, Download PNG, or Save to Library.
- **Full Webpage Scrolling**: Progress bar HUD, automatic viewport stepping, and seamless canvas stitching.
- **Media Library**: Filter by **All Media**, **Videos**, or **Screenshots**.
- **100% Full-Resolution Inspection Modal**: Click any screenshot to open the viewer modal. Toggle between **Fit to Window** and **100% Full Size** to scroll through tall full-page captures at native crisp resolution.

---

## 🏗️ Architecture & Repository Structure

```text
apertur/
├── background/
│   └── background.js      # MV3 Service Worker: stream acquisition, tab re-injection & screenshot dispatcher
├── content/
│   ├── content.js         # Cursor FX, Click Shockwaves, 3-2-1 Countdown, Area Snip & Full-Page Scroller
│   └── content.css        # Hardware-accelerated CSS animations for halo, ripples, snip box & toast HUD
├── icons/
│   ├── icon.svg           # Master vector branding artwork
│   └── icon*.png          # Multi-resolution extension icons (16px, 32px, 48px, 128px)
├── .github/
│   ├── FUNDING.yml        # GitHub Native Sponsorship button configuration (Patreon)
│   └── SUPPORT.md         # Community support guidelines and issue reporting
├── landing/
│   ├── index.html         # SEO-optimized product landing page & interactive cursor playground
│   ├── sponsor.html       # Dedicated community sponsorship, roadmap & Patreon tiers page
│   ├── landing.css        # Daylight Studio design system & responsive showcase styles
│   ├── landing.js         # Interactive 60Hz cursor physics & simulated HUD controller
│   └── assets/            # High-resolution showcase screenshots for the landing page
├── offscreen/
│   ├── offscreen.html     # Manifest V3 Offscreen Document host
│   └── offscreen.js       # WebAudio API dual-channel mixer + 12 Mbps VP9 MediaRecorder engine
├── popup/
│   ├── popup.html         # Zero-scroll Daylight Studio popup interface (376px × 578px)
│   ├── popup.css          # Compact popup styling with segmented controls & switches
│   └── popup.js           # Mode selector, screenshot dropdown, countdown/cursor toggles & telemetry
├── preview/
│   ├── preview.html       # Video Player Studio & Unified Media Library
│   ├── preview.css        # Theater player, trim bar, responsive gallery cards & 100% zoom modal
│   └── preview.js         # Inline title renaming, video trimming, frame PNG export & modal manager
├── utils/
│   └── db.js              # Promise-based IndexedDB storage engine (RecorderDB: videos & screenshots)
├── store-assets/          # 1280x800 Chrome Web Store & GitHub showcase screenshots
├── scripts/
│   ├── capture-store-screenshots.js # Automated 1280x800 showcase screenshot generator
│   ├── test-screenshots.js          # Static integrity assertion suite
│   ├── verify-all.js                # Headless Chromium layout, dimensions & overflow verifier
│   └── test-live-e2e.js             # Live browser E2E test (Area snip, full page, modal zoom, IndexedDB)
├── build.js               # Zero-dependency production bundler -> generates dist/
├── manifest.json          # Chrome Extension Manifest V3 configuration (v2.0.0)
├── SPONSORS.md            # Comprehensive sponsorship guide, budget breakdown & Patreon tiers
└── LICENSE                # MIT License
```

---

## 🧪 Testing & Verification

Apertur includes automated headless and live browser verification suites powered by Playwright and Chromium:

```bash
# 1. Run static integrity assertions
node scripts/test-screenshots.js

# 2. Verify popup dimensions, zero-scroll bounds & gallery
node scripts/verify-all.js

# 3. Run live end-to-end browser tests (Area crop, full page scroll, modal zoom & DB)
node scripts/test-live-e2e.js

# 4. Regenerate all 1280x800 showcase screenshots
node scripts/capture-store-screenshots.js
```

---

## 💖 Support the Developer & Sponsor Apertur

Apertur is built and maintained as a completely free, open-source project by **[Tahsin Soyak](https://github.com/tahsinsoyak)** under the MIT license.

There are zero cloud subscriptions, zero paywalls, and zero watermarks. If Apertur has saved you or your team from paying $15 to $29 per month for proprietary screen recorders, please consider supporting ongoing development:

[![Support on Patreon](https://img.shields.io/badge/Patreon-Support%20on%20Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/tahsinsoyak)

- **Patreon**: [patreon.com/tahsinsoyak](https://www.patreon.com/tahsinsoyak)
- **Dedicated Sponsor Page**: [Online Sponsor Page](https://tahsinsoyak.github.io/apertur/sponsor.html)
- **Sponsorship Guide & Roadmap**: [SPONSORS.md](SPONSORS.md)
- **GitHub Star**: [github.com/tahsinsoyak/apertur](https://github.com/tahsinsoyak/apertur)

### Patreon Membership Tiers

| Tier | Monthly Contribution | Highlights |
| :--- | :--- | :--- |
| ☕ **Coffee Supporter** | **$3 / month** | Shoutout in GitHub Release notes and eternal gratitude |
| 🚀 **Studio Backer** | **$10 / month** | Name listed in README & Website wall + Early access to feature builds |
| 💎 **Visionary Sponsor** | **$25 / month** | Logo & backlink on README/Website + Priority feature/bug triage |

Your contributions fund Chrome Web Store maintenance, WebCodecs and AV1 video research, webcam Picture-in-Picture overlays, and continuous open-source innovation.

---

## 📄 License

Released under the **[MIT License](LICENSE)**. 100% free forever for personal, educational, and commercial use.
